# Estonia × Japan Trade Analysis
### Did the EU–Japan EPA work?

An analysis of Estonia's bilateral trade with Japan from 2010 to 2024, examining the impact of the EU–Japan Economic Partnership Agreement (EPA) that came into force in **February 2019**.

**[→ View Interactive Dashboard](https://romanlavrunov.github.io/JP_EE_TRADE/)**

---

## Framework: Google Data Analytics (Ask → Prepare → Process → Analyze → Share → Act)

---

## Ask

### Business context

A mid-sized Estonian trading company began working with a Japanese supplier in late 2019 — coinciding with the EU–Japan EPA coming into force. The company's strategy focuses on distant markets where logistics complexity creates a natural barrier for smaller competitors. The EPA reduced that barrier significantly.

South Korea went through a similar process earlier — the EU–Korea EPA came into force in 2011. Does the Korean experience offer a preview of Japan's trajectory? And can such patterns be extrapolated to the EU–India FTA currently under negotiation?

### Research questions

1. Did Estonia's trade with Japan increase after the EPA — and how did exports and imports behave separately?
2. Which commodity groups grew in the 2019–2022 window, before geopolitical disruption set in?
3. How does the Estonia–Korea post-2011 pattern compare to Estonia–Japan post-2019?
4. How did COVID-19 and the war in Ukraine affect the data?
5. Can findings tentatively apply to the EU–India trade agreement in negotiation?

---

## Prepare

### Data sources

All data sourced from **Statistics Estonia (Statistikaamet)**, downloaded manually in Excel from the PxWeb database. Local source chosen over Eurostat — the focus is specifically on Estonia's bilateral trade.

| File | Content | Period |
|---|---|---|
| VKK32_BY_COUNTRIES.xlsx | Export/import by partner country, 177 countries | 2004–2025 |
| VKK30_JP.xlsx | Estonia–Japan trade by CN commodity group | 2004–2025 |
| VKK30_TOTAL.xlsx | Estonia total world trade by CN group | 2004–2025 |
| VKK30_PARTS_OF_WORLD.xlsx | Trade by world region | 2020–2025 |

### Business glossary

| Term | Definition |
|---|---|
| EPA | Economic Partnership Agreement — a bilateral trade agreement reducing tariffs and trade barriers |
| CN code | Combined Nomenclature — EU system for classifying goods in international trade |
| Trade balance | Exports minus imports; positive = surplus |
| Growth index (2019 = 100) | Value in any year relative to 2019, enabling like-for-like comparison across partners |

### Data glossary (selected columns)

| Source | Source Column | Output Field | Format | Description |
|---|---|---|---|---|
| Statistics Estonia | Country | country | String | Partner country name |
| Statistics Estonia | Year | year | Integer | Reference year |
| Statistics Estonia | Value (EUR thou.) | value | Float | Trade value in millions EUR (converted) |
| Statistics Estonia | CN2 Code | cn_code | String | 2-digit Combined Nomenclature group |
| Derived | — | balance | Float | exports − imports |
| Derived | — | index_2019 | Float | value / value_2019 × 100 |

### Known data issues

- **Wide format** — years stored as columns in source files, not rows
- **Missing flow labels** — "Exports" / "Imports" appears only in the first row of each block
- **`..` placeholder** — suppressed values coded as `..` rather than NA
- **Regional data gap** — VKK30_PARTS_OF_WORLD only available from 2020

---

## Process

Data cleaning and transformation was done in two stages: structural fixes in Excel, then systematic transformation in R.

### Tools used

| Tool | Purpose |
|---|---|
| R / `readxl` | Ingest raw Excel files |
| R / `dplyr`, `tidyr` | Clean, reshape and derive variables |
| R / `jsonlite` | Export to JSON for the HTML dashboard |
| Chart.js | Interactive charts in the browser |

### Key transformation steps

```r
# Core pattern used across all source files
raw <- read_excel("VKK30_JP.xlsx", skip = 2, col_names = FALSE)
colnames(raw) <- c("flow", "commodity", "country", years)

df_clean <- raw %>%
  fill(flow, .direction = "down") %>%                          # fill missing flow labels
  pivot_longer(cols = all_of(years),
               names_to = "year", values_to = "value") %>%
  mutate(value = as.numeric(ifelse(value == "..", NA, value)), # handle suppressed values
         year  = as.integer(year))

# Derived: growth index (2019 = 100)
df_index <- df_clean %>%
  group_by(cn_code, flow) %>%
  mutate(base = value[year == 2019],
         index_2019 = value / base * 100)

write_json(df_clean, "data/commodities.json", pretty = TRUE)
```

### Repository structure

```
JP_EE_TRADE/
├── data/               # Processed JSON files (output of R scripts)
│   ├── japan_trade.json
│   ├── commodities.json
│   └── partner_countries.json
├── clean_data/         # Intermediate cleaned Excel files
├── scripts/            # R transformation scripts
├── css/                # Stylesheets
├── js/                 # Chart.js visualisation logic
├── index.html          # Summary dashboard
└── case_study.html     # Full methodology & analysis
```

---

## Analyze

### Overview: trade grew — but the story is more complicated

| Metric | Value |
|---|---|
| Pre-EPA avg exports (2014–2018) | 67.6 M€/year |
| Post-EPA avg exports (2019–2023) | 110.8 M€/year |
| Change | **+64%** |
| All-time peak | **150.1 M€** in 2022 |
| Latest exports (2024) | 93.3 M€ |
| Trade balance (2024) | +41.3 M€ surplus |

### Commodity breakdown: pre vs post-EPA average annual exports

| CN Group | Description | Pre-EPA avg | Post-EPA avg | Change |
|---|---|---|---|---|
| CN44 | Wood and articles of wood | 36.3 M€ | 50.9 M€ | **+40%** |
| CN85 | Electrical machinery | 9.2 M€ | 14.6 M€ | **+59%** |
| CN28 | Inorganic chemicals | 3.3 M€ | 6.4 M€ | **+95%** |
| CN90 | Optical instruments | 4.1 M€ | 5.5 M€ | +34% |
| CN84 | Machinery | 0.6 M€ | 3.2 M€ | +428% |
| CN03 | Fish and crustaceans | 1.9 M€ | 1.0 M€ | **−48%** |
| CN04 | Dairy produce | 1.4 M€ | 1.4 M€ | +6% |

### External shocks

- **COVID-19 (2020):** brief dip, smaller than expected — wood exports proved resilient
- **Russia–Ukraine war (Feb 2022):** closure of Russian airspace eliminated routing that cut freight times by 3–4 hours; round-trip cargo times roughly doubled, maritime adds 4–6 weeks. This is the primary driver of the post-2022 decline, separate from the EPA effect.

### Partner country comparison (index 2019 = 100)

Japan's export growth outperformed Singapore (also EPA 2019) but underperformed South Korea (EPA 2011), which had 3–5 years to mature before geopolitical disruption. Kazakhstan and Bulgaria showed higher index growth for geopolitical reasons unrelated to trade agreements.

---

## Share

### Visualisation approach

| Chart type | What it shows |
|---|---|
| Line chart (bilateral) | Absolute export and import volumes 2010–2024, three event markers |
| Growth index lines | Japan vs partner countries vs global benchmark, 2019 = 100 |
| Stacked bar chart | Japan's share in Estonia's total exports and imports |
| Commodity line chart | Top CN groups over time |
| Pre/post EPA bar | % change per commodity group |
| Treemap (2023) | Export structure snapshot — CN44 Wood ≈ 40% of total |
| Slope chart | How groups moved across five key years (2015 → 2018 → 2019 → 2022 → 2024) |
| Heatmap | Growth index vs 2018 baseline, all CN groups × all years |
| Regional stacked bars | Japan in the context of global export destinations (CN44, CN03) |

All charts are built with Chart.js from JSON data generated by R scripts. Updating the dashboard only requires re-running the R scripts and uploading new JSON files.

---

## Act

### Key findings

**EPA worked — moderately.**
Post-EPA average exports were +64% above the pre-EPA baseline (67.6 → 110.8 M€/year). Real growth in wood, chemicals (+95%), and electrical machinery (+59%). Consistent with policy intent.

**Logistics beats tariffs post-2022.**
Russia's airspace closure hit Japan harder than any other major partner. Trade peaked in 2022 at 150 M€, then fell even as the EPA remained in force.

**Japan ≠ Asia.**
South Korea grew while Japan declined post-2022. Treating Asian markets as one block leads to wrong conclusions. Distance, routing, and freight infrastructure are country-specific.

**The Korea precedent.**
EU–Korea EPA (2011) took 3–5 years to show full effect. Japan is at year 5–6 — the trajectory may not be final, but requires logistics to stabilise first.

**Counter-cases are real.**
Fish exports fell 48% post-EPA. Dairy was flat. The EPA removes tariffs — it does not remove competition from other EU suppliers.

**Current conditions = selective opportunity.**
Declining volumes mean reduced competition for those who can navigate the logistics barrier. Niche, high-value, non-time-sensitive goods are best positioned.

**India: use Japan as a baseline, not a guarantee.**
EU–India FTA is in negotiation. Japan's experience — slow start, sector-specific gains, logistics-dependent — is a useful baseline. India presents even greater distance challenges.

---

## Contact

Questions or feedback: lavrunov.roman@gmail.com
