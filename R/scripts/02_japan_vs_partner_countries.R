# PURPOSE : Estonia's trade with Japan vs other partner countries
#           JSON export for HTML dashboard
#
# SOURCE  : clean_data/VKK32_BY_COUNTRIES.xlsx
#
# OUTPUT  : data/partner_countries.json

library(readxl)
library(dplyr)
library(tidyr)
library(jsonlite)

# ── LOAD & CLEAN ───────────────────────────────────────────────────────────────

df_raw <- read_excel(
  "clean_data/VKK32_BY_COUNTRIES.xlsx",
  sheet = "TRD_VAL",
  skip  = 3
)

years     <- 2004:2025
col_names <- c("flow", "country",
               paste0("val_",   years),
               paste0("share_", years))
colnames(df_raw) <- col_names
df_raw <- df_raw %>% fill(flow, .direction = "down")

countries_keep <- c(
  "JP Japan",
  "SG Singapore",
  "KR South Korea",
  "CN China",
  "US United States",
  "CH Switzerland",
  "IN India",
  "TW Taiwan (CN)"
)

df_long <- df_raw %>%
  filter(country %in% countries_keep, flow %in% c("Exports", "Imports")) %>%
  select(flow, country, starts_with("val_")) %>%
  pivot_longer(
    cols         = starts_with("val_"),
    names_to     = "year",
    names_prefix = "val_",
    values_to    = "value"
  ) %>%
  mutate(
    year  = as.integer(year),
    value = as.numeric(value)
  )

# ── COMPUTE INDEX & TURNOVER ───────────────────────────────────────────────────

df_turnover <- df_long %>%
  group_by(country, flow, year) %>%
  summarise(turnover = sum(value, na.rm = TRUE), .groups = "drop") %>%
  mutate(
    epa_status = case_when(
      country == "JP Japan"       ~ "Japan (EPA 2019)",
      country == "SG Singapore"   ~ "Singapore (EPA 2019)",
      country == "KR South Korea" ~ "South Korea (EPA 2011)",
      TRUE                         ~ "No EPA"
    )
  )

df_index <- df_turnover %>%
  group_by(country, flow) %>%
  mutate(
    base_2019 = turnover[year == 2019],
    index     = turnover / base_2019 * 100
  ) %>%
  ungroup()

# ── JSON EXPORT ────────────────────────────────────────────────────────────────

dir.create("data", showWarnings = FALSE)

partner_json <- list(

  index_exports = df_index %>%
    filter(flow == "Exports", year >= 2012, year <= 2025) %>%
    transmute(year, country, epa_status, index = round(index, 1)),

  index_imports = df_index %>%
    filter(flow == "Imports", year >= 2012, year <= 2025) %>%
    transmute(year, country, epa_status, index = round(index, 1)),

  abs_exports = df_turnover %>%
    filter(flow == "Exports", year >= 2012, year <= 2025) %>%
    transmute(year, country, epa_status, value_mln = round(turnover / 1e6, 2)),

  abs_imports = df_turnover %>%
    filter(flow == "Imports", year >= 2012, year <= 2025) %>%
    transmute(year, country, epa_status, value_mln = round(turnover / 1e6, 2))
)

write_json(partner_json, "data/partner_countries.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/partner_countries.json written")
