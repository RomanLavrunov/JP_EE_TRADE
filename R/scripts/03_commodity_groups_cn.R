# PURPOSE : Estonia ↔ Japan trade by CN commodity groups
#           Five plots + JSON export for HTML dashboard
#
# SOURCES : clean_data/VKK30_JP.xlsx
#           clean_data/VKK30_PARTS_OF_WORLD.xlsx
#           clean_data/VKK30_TOTAL.xlsx
#
# OUTPUT  : data/commodities.json
#
# CHANGES vs original script:
#   1. selected_cn: CN08, CN27, CN84 removed; CN71 added (EPA-created trade segment)
#   2. index_vs_2018: produces idx_japan + idx_world + flow (was: index_vs_2018 + cn_name)
#   3. share: covers all selected_cn, years 2004-2024 (was: 5 groups only, from 2010)
#   4. epa_comparison exports: adds avg_post_clean_mln, yoy_2018_2019, cagr_before/after/clean,
#      world_pct_change — all fields present in JSON
#   5. epa_comparison_imports: new block (CN87, CN84, CN85, CN90, CN32, CN33)
#   6. exports/imports_timeseries: years 2004-2024 (was: from 2010)
#   7. control_vs_treatment: new block
#   8. world_exports_timeseries: new block (Estonia total exports to world, same CN groups)

library(readxl)
library(tidyverse)
library(scales)
library(ggrepel)
library(jsonlite)

# ── SHARED AESTHETICS ──────────────────────────────────────────────────────────

event_lines <- list(
  geom_vline(xintercept = 2019, linetype = "dashed",  colour = "#c0392b", linewidth = 0.8),
  geom_vline(xintercept = 2020, linetype = "dotted",  colour = "#e67e22", linewidth = 0.8),
  geom_vline(xintercept = 2022, linetype = "dotdash", colour = "#7f8c8d", linewidth = 0.8),
  annotate("text", x = 2019.15, y = Inf, label = "EPA 2019",  hjust = 0, vjust = 1.6, colour = "#c0392b", size = 3.2),
  annotate("text", x = 2020.15, y = Inf, label = "COVID-19",  hjust = 0, vjust = 1.6, colour = "#e67e22", size = 3.2),
  annotate("text", x = 2022.15, y = Inf, label = "War 2022",  hjust = 0, vjust = 1.6, colour = "#7f8c8d", size = 3.2)
)

theme_trade <- theme_minimal(base_size = 12) +
  theme(
    legend.position  = "bottom",
    panel.grid.minor = element_blank(),
    plot.subtitle    = element_text(color = "grey50", size = 11)
  )

clean_value <- function(x) suppressWarnings(as.numeric(ifelse(x == "..", NA, x)))

# ── LOAD DATA ──────────────────────────────────────────────────────────────────

raw_jp <- read_excel("clean_data/VKK30_JP.xlsx", skip = 2, col_names = FALSE)
years_jp <- as.character(2004:2025)
colnames(raw_jp) <- c("flow", "commodity", "country", years_jp)

jp_long <- raw_jp %>%
  fill(flow, .direction = "down") %>%
  filter(!is.na(commodity)) %>%
  select(-country) %>%
  pivot_longer(cols = all_of(years_jp), names_to = "year", values_to = "value") %>%
  mutate(
    year    = as.integer(year),
    value   = clean_value(value),
    cn_code = str_extract(commodity, "^CN\\d+"),
    cn_name = str_trim(str_replace(commodity, "^CN\\d+\\s*", "")),
    flow    = recode(flow,
                     "Exports"                      = "Export",
                     "Imports by country of origin" = "Import")
  ) %>%
  filter(flow %in% c("Export", "Import"), year <= 2024)

raw_pow <- read_excel("clean_data/VKK30_PARTS_OF_WORLD.xlsx", skip = 2, col_names = FALSE)
years_pow <- as.character(2020:2025)
colnames(raw_pow) <- c("flow", "commodity", "region", years_pow)

pow_long <- raw_pow %>%
  fill(flow, commodity, .direction = "down") %>%
  filter(!is.na(region)) %>%
  pivot_longer(cols = all_of(years_pow), names_to = "year", values_to = "value") %>%
  mutate(
    year    = as.integer(year),
    value   = clean_value(value),
    cn_code = str_extract(commodity, "^CN\\d+"),
    cn_name = str_trim(str_replace(commodity, "^CN\\d+\\s*", "")),
    flow    = recode(flow,
                     "Exports"                      = "Export",
                     "Imports by country of origin" = "Import")
  ) %>%
  filter(year <= 2024)

raw_total <- read_excel("clean_data/VKK30_TOTAL.xlsx", skip = 2, col_names = FALSE)
years_tot <- as.character(2004:2025)
colnames(raw_total) <- c("flow", "commodity", years_tot)

total_long <- raw_total %>%
  fill(flow, .direction = "down") %>%
  filter(!is.na(commodity)) %>%
  pivot_longer(cols = all_of(years_tot), names_to = "year", values_to = "value") %>%
  mutate(
    year    = as.integer(year),
    value   = clean_value(value),
    cn_code = str_extract(commodity, "^CN\\d+"),
    cn_name = str_trim(str_replace(commodity, "^CN\\d+\\s*", "")),
    flow    = recode(flow,
                     "Exports"                      = "Export",
                     "Imports by country of origin" = "Import")
  ) %>%
  filter(year <= 2024)

# ── CN GROUP SELECTION ─────────────────────────────────────────────────────────
# JSON groups: CN03, CN04, CN28, CN44, CN71, CN85, CN90, CN94, CN95
# CN71 (Precious metals) replaces CN08/CN27/CN84 — strongest EPA-created flow
# CN84/CN08/CN27 kept in plots only via selected_cn_plots

selected_cn       <- c("CN03","CN04","CN28","CN44","CN71","CN85","CN90","CN94","CN95")
selected_cn_plots <- c("CN03","CN04","CN08","CN27","CN28","CN44","CN71","CN84","CN85","CN90","CN94","CN95")

# Import groups for epa_comparison_imports (top groups by total import volume)
selected_cn_imports <- c("CN87","CN84","CN85","CN90","CN32","CN33")

# ── ANALYTICAL DATASETS ────────────────────────────────────────────────────────

# Japan share in Estonia's total exports
jp_share <- jp_long %>%
  filter(cn_code %in% selected_cn, !is.na(value)) %>%
  rename(value_jp = value) %>%
  left_join(
    total_long %>% select(cn_code, flow, year, value_world = value),
    by = c("cn_code", "flow", "year")
  ) %>%
  mutate(jp_share_pct = 100 * value_jp / value_world)

# Index vs 2018 = 100 — Japan AND World, Export only
# Output fields: year, cn_code, flow, idx_japan, idx_world
epa_index <- jp_long %>%
  filter(cn_code %in% selected_cn, flow == "Export", !is.na(value)) %>%
  group_by(cn_code) %>%
  mutate(
    base_jp   = mean(value[year == 2018], na.rm = TRUE),
    idx_japan = round(100 * value / base_jp, 1)
  ) %>%
  ungroup() %>%
  left_join(
    total_long %>%
      filter(cn_code %in% selected_cn, flow == "Export") %>%
      group_by(cn_code) %>%
      mutate(
        base_world = mean(value[year == 2018], na.rm = TRUE),
        idx_world  = round(100 * value / base_world, 1)
      ) %>%
      ungroup() %>%
      select(cn_code, year, idx_world),
    by = c("cn_code", "year")
  ) %>%
  mutate(flow = "Export")

# Helper: CAGR over n years
cagr <- function(end_val, start_val, n) {
  ifelse(is.na(end_val) | is.na(start_val) | start_val <= 0, NA_real_,
         round(((end_val / start_val)^(1/n) - 1) * 100, 1))
}

# EPA comparison — EXPORTS
build_epa_summary <- function(df, cn_codes) {
  df %>%
    filter(cn_code %in% cn_codes, flow == "Export", !is.na(value)) %>%
    group_by(cn_code, cn_name) %>%
    summarise(
      pre                = round(mean(value[year >= 2014 & year <= 2018], na.rm = TRUE) / 1e6, 3),
      post               = round(mean(value[year >= 2019 & year <= 2023], na.rm = TRUE) / 1e6, 3),
      avg_post_clean_mln = round(mean(value[year >= 2020 & year <= 2024], na.rm = TRUE) / 1e6, 3),
      v2014 = mean(value[year == 2014], na.rm = TRUE),
      v2018 = mean(value[year == 2018], na.rm = TRUE),
      v2019 = mean(value[year == 2019], na.rm = TRUE),
      v2020 = mean(value[year == 2020], na.rm = TRUE),
      v2023 = mean(value[year == 2023], na.rm = TRUE),
      v2024 = mean(value[year == 2024], na.rm = TRUE),
      .groups = "drop"
    ) %>%
    mutate(
      pct_change      = round((post - pre) / pre * 100, 0),
      direction       = if_else(post >= pre, "up", "down"),
      yoy_2018_2019   = round((v2019 - v2018) / v2018 * 100, 1),
      cagr_before_pct = cagr(v2018, v2014, 4),
      cagr_after_pct  = cagr(v2023, v2019, 4),
      cagr_clean_pct  = cagr(v2024, v2020, 4)
    ) %>%
    select(-v2014, -v2018, -v2019, -v2020, -v2023, -v2024)
}

epa_summary_exports <- build_epa_summary(jp_long, selected_cn)

# Add world_pct_change (same 2014-2018 vs 2019-2023 window, total_long)
world_pct <- total_long %>%
  filter(cn_code %in% selected_cn, flow == "Export", !is.na(value)) %>%
  group_by(cn_code) %>%
  summarise(
    world_pre  = mean(value[year >= 2014 & year <= 2018], na.rm = TRUE),
    world_post = mean(value[year >= 2019 & year <= 2023], na.rm = TRUE),
    .groups = "drop"
  ) %>%
  mutate(world_pct_change = round((world_post - world_pre) / world_pre * 100, 0)) %>%
  select(cn_code, world_pct_change)

epa_summary_exports <- epa_summary_exports %>%
  left_join(world_pct, by = "cn_code") %>%
  select(cn_code, pre, post, avg_post_clean_mln,
         pct_change, direction, yoy_2018_2019,
         cagr_before_pct, cagr_after_pct, cagr_clean_pct,
         world_pct_change, cn_name)

# EPA comparison — IMPORTS (no world_pct_change)
epa_summary_imports <- jp_long %>%
  filter(cn_code %in% selected_cn_imports, flow == "Import", !is.na(value)) %>%
  group_by(cn_code, cn_name) %>%
  summarise(
    pre                = round(mean(value[year >= 2014 & year <= 2018], na.rm = TRUE) / 1e6, 3),
    post               = round(mean(value[year >= 2019 & year <= 2023], na.rm = TRUE) / 1e6, 3),
    avg_post_clean_mln = round(mean(value[year >= 2020 & year <= 2024], na.rm = TRUE) / 1e6, 3),
    v2014 = mean(value[year == 2014], na.rm = TRUE),
    v2018 = mean(value[year == 2018], na.rm = TRUE),
    v2019 = mean(value[year == 2019], na.rm = TRUE),
    v2020 = mean(value[year == 2020], na.rm = TRUE),
    v2023 = mean(value[year == 2023], na.rm = TRUE),
    v2024 = mean(value[year == 2024], na.rm = TRUE),
    .groups = "drop"
  ) %>%
  mutate(
    pct_change      = round((post - pre) / pre * 100, 0),
    direction       = if_else(post >= pre, "up", "down"),
    yoy_2018_2019   = round((v2019 - v2018) / v2018 * 100, 1),
    cagr_before_pct = cagr(v2018, v2014, 4),
    cagr_after_pct  = cagr(v2023, v2019, 4),
    cagr_clean_pct  = cagr(v2024, v2020, 4)
  ) %>%
  select(cn_code, pre, post, avg_post_clean_mln,
         pct_change, direction, yoy_2018_2019,
         cagr_before_pct, cagr_after_pct, cagr_clean_pct,
         cn_name)

# Control vs treatment
treatment_cn <- c("CN44","CN85","CN28","CN71","CN90","CN94")
control_cn   <- c("CN03","CN04","CN95")

control_vs_treatment <- jp_long %>%
  filter(cn_code %in% c(treatment_cn, control_cn), flow == "Export", !is.na(value)) %>%
  mutate(group = if_else(cn_code %in% treatment_cn, "treatment", "control")) %>%
  group_by(group, cn_code) %>%
  summarise(
    avg_pre   = mean(value[year >= 2014 & year <= 2018], na.rm = TRUE) / 1e6,
    avg_clean = mean(value[year >= 2020 & year <= 2024], na.rm = TRUE) / 1e6,
    .groups = "drop"
  ) %>%
  group_by(group) %>%
  summarise(
    avg_pre   = round(mean(avg_pre),   3),
    avg_clean = round(mean(avg_clean), 3),
    .groups = "drop"
  ) %>%
  mutate(
    pct_change = round((avg_clean - avg_pre) / avg_pre * 100, 1),
    label = if_else(group == "treatment",
                    "CN44 Wood, CN85 Electronics, CN28 Chem, CN71 PreciousMetals, CN90 Optical, CN94 Furniture",
                    "CN03 Fish, CN04 Dairy, CN95 Toys — minimal EPA tariff change")
  ) %>%
  select(group, label, avg_pre, avg_clean, pct_change)

# Z-score anomaly detection
# Baseline: mean and SD over 2014–2018. Then score each post-EPA year.
# Interpretation: |Z| > 2 → statistically anomalous vs pre-EPA distribution.
# Useful for distinguishing EPA-driven jump from normal year-to-year noise.
# Note: CN85/CN90 spike in 2020 (not 2019) — EPA effect with one-year lag.
# CN95 anomaly in control group warrants caution in interpretation.

z_score <- jp_long %>%
  filter(cn_code %in% selected_cn, flow == "Export", !is.na(value)) %>%
  group_by(cn_code, cn_name) %>%
  mutate(
    mean_pre = mean(value[year >= 2014 & year <= 2018], na.rm = TRUE),
    sd_pre   = sd(  value[year >= 2014 & year <= 2018], na.rm = TRUE)
  ) %>%
  ungroup() %>%
  filter(year %in% c(2019, 2020, 2021, 2022)) %>%
  mutate(
    z = round((value - mean_pre) / sd_pre, 2),
    anomaly = case_when(
      abs(z) >  2 ~ "anomaly",
      abs(z) >= 1 ~ "borderline",
      TRUE         ~ "normal"
    ),
    group = if_else(cn_code %in% c("CN44","CN85","CN28","CN71","CN90","CN94"),
                    "treatment", "control")
  ) %>%
  transmute(
    cn_code,
    cn_name,
    year,
    value_mln  = round(value / 1e6, 3),
    mean_pre   = round(mean_pre / 1e6, 3),
    sd_pre     = round(sd_pre   / 1e6, 3),
    z_score    = z,
    anomaly,
    group
  )

# ── PLOTS ──────────────────────────────────────────────────────────────────────

top6_exp <- jp_long %>%
  filter(cn_code %in% selected_cn_plots, flow == "Export", !is.na(value)) %>%
  group_by(cn_code, cn_name) %>%
  summarise(total = sum(value, na.rm = TRUE), .groups = "drop") %>%
  slice_max(total, n = 6) %>%
  mutate(cn_label = paste0(cn_code, " ", str_trunc(cn_name, 22)))

p1 <- jp_long %>%
  filter(cn_code %in% top6_exp$cn_code, flow == "Export") %>%
  left_join(top6_exp %>% select(cn_code, cn_label), by = "cn_code") %>%
  ggplot(aes(x = year, y = value / 1e6, colour = cn_label)) +
  event_lines +
  geom_line(linewidth = 1.1, na.rm = TRUE) +
  geom_point(size = 1.8, na.rm = TRUE) +
  scale_x_continuous(breaks = seq(2004, 2024, 4)) +
  scale_y_continuous(labels = label_comma(suffix = " M€")) +
  labs(title = "Estonia → Japan: exports by CN group",
       subtitle = "Top-6 groups by total 2004–2024 value, million EUR",
       x = NULL, y = "Million EUR", colour = NULL) +
  theme_trade
print(p1)

top6_imp <- jp_long %>%
  filter(cn_code %in% selected_cn_plots, flow == "Import", !is.na(value)) %>%
  group_by(cn_code, cn_name) %>%
  summarise(total = sum(value, na.rm = TRUE), .groups = "drop") %>%
  slice_max(total, n = 6) %>%
  mutate(cn_label = paste0(cn_code, " ", str_trunc(cn_name, 22)))

p2 <- jp_long %>%
  filter(cn_code %in% top6_imp$cn_code, flow == "Import") %>%
  left_join(top6_imp %>% select(cn_code, cn_label), by = "cn_code") %>%
  ggplot(aes(x = year, y = value / 1e6, colour = cn_label)) +
  event_lines +
  geom_line(linewidth = 1.1, na.rm = TRUE) +
  geom_point(size = 1.8, na.rm = TRUE) +
  scale_x_continuous(breaks = seq(2004, 2024, 4)) +
  scale_y_continuous(labels = label_comma(suffix = " M€")) +
  labs(title = "Japan → Estonia: imports by CN group",
       subtitle = "Top-6 groups by total 2004–2024 value, million EUR",
       x = NULL, y = "Million EUR", colour = NULL) +
  theme_trade
print(p2)

p3 <- jp_share %>%
  filter(flow == "Export", cn_code %in% c("CN03","CN44","CN71","CN85","CN28")) %>%
  mutate(cn_label = paste0(cn_code, " ", str_trunc(cn_name, 22))) %>%
  ggplot(aes(x = year, y = jp_share_pct, colour = cn_label)) +
  event_lines +
  geom_line(linewidth = 1.1, na.rm = TRUE) +
  geom_point(size = 1.8, na.rm = TRUE) +
  scale_x_continuous(breaks = seq(2004, 2024, 4)) +
  scale_y_continuous(labels = label_percent(scale = 1, accuracy = 0.1)) +
  labs(title = "Japan's share in Estonia's total exports by CN group",
       subtitle = "CN44 Wood dominates; CN71 Precious metals emerged post-EPA",
       x = NULL, y = "% of Estonia's total world export", colour = NULL) +
  theme_trade
print(p3)

p4 <- pow_long %>%
  filter(cn_code %in% c("CN03","CN44"), flow == "Export", !is.na(value)) %>%
  mutate(
    cn_label = recode(cn_code,
                      "CN03" = "CN03 Fish & seafood",
                      "CN44" = "CN44 Wood & articles"),
    region = factor(region,
                    levels = c("EUR Europe","ASI Asia","AME America","AFR Africa","JP Japan"))
  ) %>%
  ggplot(aes(x = factor(year), y = value / 1e6, fill = region)) +
  geom_col(position = "stack") +
  facet_wrap(~cn_label, scales = "free_y") +
  scale_fill_brewer(palette = "Set2", name = "Region") +
  labs(title = "Export structure by world region: CN03 Fish vs CN44 Wood",
       subtitle = "Stacked bars, million EUR · 2020–2024 · Japan shown at top",
       x = NULL, y = "Million EUR") +
  theme_trade +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
print(p4)

# ── JSON EXPORT ────────────────────────────────────────────────────────────────

dir.create("data", showWarnings = FALSE)

commodities_json <- list(
  
  exports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn, flow == "Export",
           year >= 2004, year <= 2024) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),
  
  imports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn, flow == "Import",
           year >= 2004, year <= 2024) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),
  
  share = jp_share %>%
    filter(flow == "Export", cn_code %in% selected_cn,
           year >= 2004, year <= 2024) %>%
    transmute(year, cn_code, jp_share_pct = round(jp_share_pct, 2)),
  
  epa_comparison = epa_summary_exports,
  
  epa_comparison_imports = epa_summary_imports,
  
  # Fields: year, cn_code, flow, idx_japan, idx_world
  index_vs_2018 = epa_index %>%
    filter(year >= 2010, year <= 2024) %>%
    transmute(year, cn_code, flow, idx_japan, idx_world),
  
  regional = pow_long %>%
    filter(cn_code %in% c("CN03","CN44"), flow == "Export", !is.na(value)) %>%
    transmute(year, cn_code, region, value = round(value / 1e6, 3)),
  
  control_vs_treatment = control_vs_treatment,
  
  # Z-score anomaly detection (2019–2022 vs 2014–2018 baseline)
  # Fields: cn_code, cn_name, year, value_mln, mean_pre, sd_pre, z_score, anomaly, group
  z_score = z_score,
  
  world_exports_timeseries = total_long %>%
    filter(cn_code %in% selected_cn, flow == "Export",
           year >= 2004, year <= 2024) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3))
)

write_json(commodities_json, "data/commodities.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/commodities.json written")