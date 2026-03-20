# PURPOSE : Estonia ↔ Japan bilateral trade overview (VKK32 level)
#           Three plots + JSON export for HTML dashboard
#
# SOURCE  : clean_data/VKK32_export_import_japan.xlsx
#           clean_data/VKK32_global_import_export.xlsx
#
# OUTPUT  : data/japan_trade.json

library(readxl)
library(dplyr)
library(tidyr)
library(jsonlite)

# LOAD DATA

df_japan <- read_excel(
  "clean_data/VKK32_export_import_japan.xlsx",
  sheet = "TRD_VAL"
) %>%
  mutate(
    year                        = as.integer(year),
    export_to_japan_eur         = as.numeric(export_to_japan_eur),
    import_from_japan_eur       = as.numeric(import_from_japan_eur),
    share_of_export_for_estonia = as.numeric(share_of_export_for_estonia),
    share_of_import_for_estonia = as.numeric(share_of_import_for_estonia)
  )

df_global <- read_excel(
  "clean_data/VKK32_global_import_export.xlsx",
  sheet = "TRD_VAL"
) %>%
  mutate(
    year          = as.integer(year),
    export_global = as.numeric(export_global),
    import_global = as.numeric(import_global)
  )

df_jp_long <- df_japan %>%
  select(year, export_to_japan_eur, import_from_japan_eur) %>%
  pivot_longer(
    cols      = c(export_to_japan_eur, import_from_japan_eur),
    names_to  = "type",
    values_to = "value"
  ) %>%
  mutate(
    type   = recode(type,
                    "export_to_japan_eur"   = "Exports",
                    "import_from_japan_eur" = "Imports"
    ),
    region = "Japan"
  )

df_gl_long <- df_global %>%
  select(year, export_global, import_global) %>%
  pivot_longer(
    cols      = c(export_global, import_global),
    names_to  = "type",
    values_to = "value"
  ) %>%
  mutate(
    type   = recode(type,
                    "export_global" = "Exports",
                    "import_global" = "Imports"
    ),
    region = "Global"
  )

df_index <- bind_rows(df_jp_long, df_gl_long) %>%
  group_by(region, type) %>%
  mutate(
    base  = value[year == 2019],
    index = value / base * 100
  ) %>%
  ungroup() %>%
  mutate(series = interaction(region, type, sep = " · "))

# JSON EXPORT — runs after all plots
# Output: data/japan_trade.json

dir.create("data", showWarnings = FALSE)

japan_json <- list(
  
  # Bilateral trade absolute values (M€)
  bilateral = df_japan %>%
    filter(year >= 2012, year <= 2024) %>%
    transmute(
      year     = year,
      exports  = round(export_to_japan_eur  / 1e6, 2),
      imports  = round(import_from_japan_eur / 1e6, 2),
      balance  = round((export_to_japan_eur - import_from_japan_eur) / 1e6, 2),
      shareExp = round(share_of_export_for_estonia, 3),
      shareImp = round(share_of_import_for_estonia, 3)
    ),
  
  # Growth index vs global (2019 = 100)
  index = df_index %>%
    filter(year >= 2012, year <= 2024) %>%
    transmute(
      year   = year,
      series = as.character(series),
      index  = round(index, 1)
    )
)

write_json(japan_json, "data/japan_trade.json", pretty = TRUE, auto_unbox = TRUE)