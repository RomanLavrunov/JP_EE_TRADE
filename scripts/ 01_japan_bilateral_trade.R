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
library(ggplot2)
library(scales)
library(jsonlite)

# SHARED EVENT MARKERS

event_lines <- list(
  geom_vline(xintercept = 2019, linetype = "dashed",  color = "#c0392b", linewidth = 0.8),
  geom_vline(xintercept = 2020, linetype = "dotted",  color = "#e67e22", linewidth = 0.8),
  geom_vline(xintercept = 2022, linetype = "dotdash", color = "#7f8c8d", linewidth = 0.8),
  annotate("text", x = 2019.15, y = Inf, label = "EPA 2019",  hjust = 0, vjust = 1.6, color = "#c0392b", size = 3.2),
  annotate("text", x = 2020.15, y = Inf, label = "COVID-19",  hjust = 0, vjust = 1.6, color = "#e67e22", size = 3.2),
  annotate("text", x = 2022.15, y = Inf, label = "War 2022",  hjust = 0, vjust = 1.6, color = "#7f8c8d", size = 3.2)
)

theme_trade <- theme_minimal(base_size = 13) +
  theme(legend.position  = "right",
        panel.grid.minor = element_blank(),
        plot.subtitle    = element_text(color = "grey50", size = 11))

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

# PLOT 1 — Absolute exports & imports to/from Japan, M€

df_abs <- df_japan %>%
  select(year, export_to_japan_eur, import_from_japan_eur) %>%
  pivot_longer(
    cols      = c(export_to_japan_eur, import_from_japan_eur),
    names_to  = "type",
    values_to = "value"
  ) %>%
  mutate(type = recode(type,
                       "export_to_japan_eur"   = "Exports to Japan",
                       "import_from_japan_eur" = "Imports from Japan"
  ))

p1 <- ggplot(
  df_abs %>% filter(year >= 2010),
  aes(x = year, y = value / 1e6, color = type)
) +
  event_lines +
  geom_line(linewidth = 1.2) +
  geom_point(size = 2.5) +
  scale_color_manual(
    values = c("Exports to Japan" = "#1D3557", "Imports from Japan" = "#E63946"),
    name   = NULL
  ) +
  scale_x_continuous(breaks = seq(2010, 2024, 2)) +
  scale_y_continuous(labels = comma) +
  labs(
    title    = "Estonia–Japan trade: exports and imports",
    subtitle = "Absolute values, million EUR · 2010–2024",
    x        = NULL,
    y        = "Million EUR"
  ) +
  theme_trade

print(p1)

# PLOT 2 — Japan's share in Estonia's total trade, %

df_share <- df_japan %>%
  select(year, share_of_export_for_estonia, share_of_import_for_estonia) %>%
  pivot_longer(
    cols      = c(share_of_export_for_estonia, share_of_import_for_estonia),
    names_to  = "type",
    values_to = "value"
  ) %>%
  mutate(type = recode(type,
                       "share_of_export_for_estonia" = "Export share",
                       "share_of_import_for_estonia" = "Import share"
  ))

p2 <- ggplot(
  df_share,
  aes(x = factor(year), y = value, fill = type)
) +
  geom_col(position = "dodge") +
  annotate("rect", xmin = 15.5, xmax = 16.5, ymin = -Inf, ymax = Inf,
           fill = "#c0392b", alpha = 0.06) +
  annotate("text", x = 16, y = Inf, label = "EPA\n2019",
           vjust = 1.5, color = "#c0392b", size = 3, fontface = "bold") +
  scale_fill_manual(
    values = c("Export share" = "#1D3557", "Import share" = "#E63946"),
    name   = NULL
  ) +
  scale_x_discrete(breaks = as.character(seq(2004, 2024, 2))) +
  labs(
    title    = "Japan's share in Estonia's total trade",
    subtitle = "Export share and import share, % · 2004–2024",
    x        = NULL,
    y        = "Share (%)"
  ) +
  theme_trade +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

print(p2)

# PLOT 3 — Growth index vs global (2019 = 100)

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

colors_index <- c(
  "Japan · Exports"  = "#1D3557",
  "Japan · Imports"  = "#E63946",
  "Global · Exports" = "#A8DADC",
  "Global · Imports" = "#F4A261"
)

p3 <- ggplot(
  df_index %>% filter(year >= 2010),
  aes(x = year, y = index, color = series, linetype = region)
) +
  event_lines +
  geom_line(linewidth = 1.2) +
  geom_point(size = 2.5) +
  geom_hline(yintercept = 100, linetype = "dotted", color = "grey70") +
  scale_color_manual(values = colors_index, name = NULL) +
  scale_linetype_manual(
    values = c("Japan" = "solid", "Global" = "dashed"),
    name   = NULL
  ) +
  scale_x_continuous(breaks = seq(2010, 2024, 2)) +
  scale_y_continuous(labels = comma) +
  labs(
    title    = "Estonia–Japan trade vs global trade: growth index",
    subtitle = "Index 2019 = 100 · Japan (solid) vs Global (dashed)",
    x        = NULL,
    y        = "Index (2019 = 100)"
  ) +
  theme_trade

print(p3)

# JSON EXPORT — runs after all plots
# Output: data/japan_trade.json

dir.create("data", showWarnings = FALSE)

japan_json <- list(
  
  # Bilateral trade absolute values (M€)
  bilateral = df_japan %>%
    filter(year >= 2010, year <= 2024) %>%
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
    filter(year >= 2010, year <= 2024) %>%
    transmute(
      year   = year,
      series = as.character(series),
      index  = round(index, 1)
    )
)

write_json(japan_json, "data/japan_trade.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/japan_trade.json written")