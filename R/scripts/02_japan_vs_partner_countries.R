# PURPOSE : Estonia's trade with Japan compared to other partner countries
#           Four plots + JSON export for HTML dashboard
#
# SOURCE  : clean_data/VKK32_BY_COUNTRIES.xlsx
#
# OUTPUT  : data/partner_countries.json

library(readxl)
library(dplyr)
library(tidyr)
library(ggplot2)
library(ggrepel)
library(scales)
library(jsonlite)

# LOAD & CLEAN

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

df_countries <- df_raw %>%
  filter(
    country %in% countries_keep,
    flow    %in% c("Exports", "Imports")
  )

df_long <- df_countries %>%
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

# SHARED AESTHETICS

colors <- c(
  "Japan (EPA 2019)"       = "#E63946",
  "Singapore (EPA 2019)"   = "#457B9D",
  "South Korea (EPA 2011)" = "#F4A261",
  "No EPA"                 = "#A8DADC"
)

line_sizes <- c(
  "JP Japan"         = 1.6,
  "SG Singapore"     = 1.3,
  "KR South Korea"   = 1.2,
  "CN China"         = 0.8,
  "US United States" = 0.8,
  "CH Switzerland"   = 0.8,
  "IN India"         = 0.8,
  "TW Taiwan (CN)"   = 0.8
)

point_shapes <- c(
  "JP Japan"         = 16,
  "SG Singapore"     = 18,
  "KR South Korea"   = 17,
  "CN China"         = 1,
  "US United States" = 2,
  "CH Switzerland"   = 5,
  "IN India"         = 15,
  "TW Taiwan (CN)"   = 8
)

event_lines <- list(
  geom_vline(xintercept = 2019, linetype = "dashed",  color = "#c0392b", linewidth = 0.8),
  geom_vline(xintercept = 2020, linetype = "dotted",  color = "#e67e22", linewidth = 0.8),
  geom_vline(xintercept = 2022, linetype = "dotdash", color = "#7f8c8d", linewidth = 0.8),
  annotate("text", x = 2019.15, y = Inf, label = "EPA 2019",  hjust = 0, vjust = 1.6, color = "#c0392b", size = 3.2),
  annotate("text", x = 2020.15, y = Inf, label = "COVID-19",  hjust = 0, vjust = 1.6, color = "#e67e22", size = 3.2),
  annotate("text", x = 2022.15, y = Inf, label = "War 2022",  hjust = 0, vjust = 1.6, color = "#7f8c8d", size = 3.2)
)

theme_trade <- theme_minimal(base_size = 12) +
  theme(
    legend.position  = "right",
    panel.grid.minor = element_blank(),
    plot.subtitle    = element_text(color = "grey50", size = 11)
  )

plot_countries <- function(df, y_col, title, subtitle, y_label, scale_factor = 1) {
  df <- df %>% mutate(y_val = .data[[y_col]] / scale_factor)
  ggplot(
    df %>% filter(year >= 2010),
    aes(x = year, y = y_val, color = epa_status, group = country,
        linetype = flow, size = country, shape = country)
  ) +
    event_lines +
    geom_line() +
    geom_point(size = 3) +
    geom_text_repel(
      data        = df %>% filter(year == 2024, !is.na(y_val)),
      aes(label   = country),
      nudge_x     = 0.3,
      direction   = "y",
      hjust       = 0,
      size        = 3,
      show.legend = FALSE
    ) +
    scale_color_manual(values = colors,       name = "EPA status") +
    scale_size_manual( values = line_sizes,   guide = "none") +
    scale_shape_manual(values = point_shapes, name = "Country") +
    scale_linetype_manual(
      values = c("Exports" = "solid", "Imports" = "solid"),
      name   = "Flow"
    ) +
    scale_x_continuous(breaks = seq(2010, 2024, 2)) +
    scale_y_continuous(labels = comma) +
    labs(title = title, subtitle = subtitle, x = NULL, y = y_label) +
    theme_trade
}

print(plot_countries(df_index   %>% filter(flow == "Exports"), "index",
                     "Estonia exports: Japan vs partner countries — relative index",
                     "Index 2019 = 100", "Index (2019 = 100)"))

print(plot_countries(df_index   %>% filter(flow == "Imports"), "index",
                     "Estonia imports: Japan vs partner countries — relative index",
                     "Index 2019 = 100", "Index (2019 = 100)"))

print(plot_countries(df_turnover %>% filter(flow == "Exports"), "turnover",
                     "Estonia exports: absolute values", "Million EUR", "Million EUR", 1e6))

print(plot_countries(df_turnover %>% filter(flow == "Imports"), "turnover",
                     "Estonia imports: absolute values", "Million EUR", "Million EUR", 1e6))

# JSON EXPORT
# Output: data/partner_countries.json

dir.create("data", showWarnings = FALSE)

partner_json <- list(
  
  # Index 2019 = 100 for exports
  index_exports = df_index %>%
    filter(flow == "Exports", year >= 2010, year <= 2024) %>%
    transmute(
      year       = year,
      country    = country,
      epa_status = epa_status,
      index      = round(index, 1)
    ),
  
  # Index 2019 = 100 for imports
  index_imports = df_index %>%
    filter(flow == "Imports", year >= 2010, year <= 2024) %>%
    transmute(
      year       = year,
      country    = country,
      epa_status = epa_status,
      index      = round(index, 1)
    ),
  
  # Absolute turnover exports (M€)
  abs_exports = df_turnover %>%
    filter(flow == "Exports", year >= 2010, year <= 2024) %>%
    transmute(
      year       = year,
      country    = country,
      epa_status = epa_status,
      value_mln  = round(turnover / 1e6, 2)
    ),
  
  # Absolute turnover imports (M€)
  abs_imports = df_turnover %>%
    filter(flow == "Imports", year >= 2010, year <= 2024) %>%
    transmute(
      year       = year,
      country    = country,
      epa_status = epa_status,
      value_mln  = round(turnover / 1e6, 2)
    )
)

write_json(partner_json, "data/partner_countries.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/partner_countries.json written")