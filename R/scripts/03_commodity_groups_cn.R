# PURPOSE : Estonia ↔ Japan trade by CN commodity groups
#           Five plots + JSON export for HTML dashboard
#
# SOURCES : clean_data/VKK30_JP.xlsx
#           clean_data/VKK30_PARTS_OF_WORLD.xlsx
#           clean_data/VKK30_TOTAL.xlsx
#
# OUTPUT  : data/commodities.json

library(readxl)
library(tidyverse)
library(scales)
library(ggrepel)
library(jsonlite)

# SHARED EVENT MARKERS

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

# LOAD DATA

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

# SELECTED CN GROUPS

selected_cn <- c("CN03","CN04","CN08","CN27","CN28","CN44",
                 "CN84","CN85","CN90","CN94","CN95")

jp_sel    <- jp_long    %>% filter(cn_code %in% selected_cn)
pow_sel   <- pow_long   %>% filter(cn_code %in% selected_cn)
total_sel <- total_long %>% filter(cn_code %in% selected_cn)

# ANALYTICAL DATASETS

jp_share <- jp_long %>%
  filter(cn_code %in% selected_cn, !is.na(value)) %>%
  rename(value_jp = value) %>%
  left_join(
    total_long %>% select(cn_code, flow, year, value_world = value),
    by = c("cn_code", "flow", "year")
  ) %>%
  mutate(jp_share_pct = 100 * value_jp / value_world)

epa_index <- jp_long %>%
  filter(cn_code %in% selected_cn, !is.na(value)) %>%
  group_by(cn_code, flow) %>%
  mutate(
    base_2018     = mean(value[year == 2018], na.rm = TRUE),
    index_vs_2018 = 100 * value / base_2018
  ) %>%
  ungroup()

# PLOTS

top6_exp <- jp_long %>%
  filter(cn_code %in% selected_cn, flow == "Export", !is.na(value)) %>%
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
  filter(cn_code %in% selected_cn, flow == "Import", !is.na(value)) %>%
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
  filter(flow == "Export", cn_code %in% c("CN03","CN44","CN84","CN85","CN28")) %>%
  mutate(cn_label = paste0(cn_code, " ", str_trunc(cn_name, 22))) %>%
  ggplot(aes(x = year, y = jp_share_pct, colour = cn_label)) +
  event_lines +
  geom_line(linewidth = 1.1, na.rm = TRUE) +
  geom_point(size = 1.8, na.rm = TRUE) +
  scale_x_continuous(breaks = seq(2004, 2024, 4)) +
  scale_y_continuous(labels = label_percent(scale = 1, accuracy = 0.1)) +
  labs(title = "Japan's share in Estonia's total exports by CN group",
       subtitle = "CN44 Wood dominates; CN84 Machinery grew post-EPA",
       x = NULL, y = "% of Estonia's total world export", colour = NULL) +
  theme_trade
print(p3)

p4 <- pow_sel %>%
  filter(flow == "Export", cn_code %in% c("CN03","CN44"), !is.na(value)) %>%
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

# JSON EXPORT
# Output: data/commodities.json


dir.create("data", showWarnings = FALSE)

# Pre/post EPA averages per CN group
epa_summary <- jp_long %>%
  filter(cn_code %in% selected_cn, flow == "Export", !is.na(value)) %>%
  mutate(period = case_when(
    year >= 2014 & year <= 2018 ~ "pre",
    year >= 2019 & year <= 2023 ~ "post",
    TRUE ~ NA_character_
  )) %>%
  filter(!is.na(period)) %>%
  group_by(cn_code, cn_name, period) %>%
  summarise(avg_mln = round(mean(value, na.rm = TRUE) / 1e6, 2), .groups = "drop") %>%
  pivot_wider(names_from = period, values_from = avg_mln) %>%
  mutate(
    pct_change = round((post - pre) / pre * 100, 0),
    direction  = if_else(post >= pre, "up", "down")
  )

commodities_json <- list(
  
  # Time series exports to Japan by CN group (M€)
  exports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn, flow == "Export",
           year >= 2010, year <= 2024) %>%
    transmute(
      year    = year,
      cn_code = cn_code,
      cn_name = cn_name,
      value   = round(value / 1e6, 3)
    ),
  
  # Time series imports from Japan by CN group (M€)
  imports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn, flow == "Import",
           year >= 2010, year <= 2024) %>%
    transmute(
      year    = year,
      cn_code = cn_code,
      cn_name = cn_name,
      value   = round(value / 1e6, 3)
    ),
  
  # Japan's share in Estonia's total exports per CN group (%)
  share = jp_share %>%
    filter(flow == "Export", cn_code %in% c("CN03","CN44","CN84","CN85","CN28"),
           year >= 2010, year <= 2024) %>%
    transmute(
      year          = year,
      cn_code       = cn_code,
      jp_share_pct  = round(jp_share_pct, 2)
    ),
  
  # Pre vs post EPA averages (M€) + % change
  epa_comparison = epa_summary,
  
  # Growth index vs 2018 = 100
  index_vs_2018 = epa_index %>%
    filter(flow == "Export", year >= 2014, year <= 2024) %>%
    transmute(
      year          = year,
      cn_code       = cn_code,
      cn_name       = cn_name,
      index_vs_2018 = round(index_vs_2018, 1)
    ),
  
  # Regional breakdown 2020-2024 for CN03 and CN44
  regional = pow_long %>%
    filter(cn_code %in% c("CN03","CN44"), flow == "Export", !is.na(value)) %>%
    transmute(
      year    = year,
      cn_code = cn_code,
      region  = region,
      value   = round(value / 1e6, 3)
    )
)

write_json(commodities_json, "data/commodities.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/commodities.json written")