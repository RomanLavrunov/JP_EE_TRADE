# PURPOSE : Estonia ↔ Japan trade by CN commodity groups — Pareto classification
#           JSON export for HTML dashboard
#
# SOURCES : clean_data/VKK30_JP.xlsx
#           clean_data/VKK30_PARTS_OF_WORLD.xlsx
#           clean_data/VKK30_TOTAL.xlsx
#           clean_data/VKK30_44_71_84_85.xlsx   ← CN44/71/84/85 by individual country
#
# OUTPUT  : data/commodities.json
#
# METHODOLOGY (v21):
#   Composite score = avg(share_FTA, share_Δ)
#     share_FTA = fta_mean / C3    (group's share of ALL bilateral trade in EPA period)
#     share_Δ   = abs_change / D4  (group's share of total absolute growth, k>1 only)
#   C3 and D4 are computed from data — NOT hardcoded.
#
#   Classification (applied separately per flow: Export, Import):
#     Step 1 — NoTrade  : fta_mean == 0
#     Step 2 — Growing  : k > 1 AND abs_change > 0
#     Step 3 — Pareto A : cumulative score ≤ THRESH_A (80%)
#              Pareto B : cumulative score ≤ THRESH_B (95%) OR abs_change ≥ MIN_ABS_B (1M EUR)
#              Tail     : the rest of growing groups
#     Step 4 — Spike    : declining (k ≤ 1) AND yoy_18_19 ≥ SPIKE_YOY (2×) AND fta_mean ≥ SPIKE_MIN (1M EUR)
#     Step 5 — Negative : remaining declining groups
#
#   Analysis period — SHORT window (adjustable via constants below):
#     PRE  = PRE_START : PRE_END
#     EPA  = EPA_START : EPA_END

library(readxl)
library(dplyr)
library(tidyr)
library(stringr)
library(jsonlite)

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — change here, nowhere else
# ══════════════════════════════════════════════════════════════════════════════

PRE_START  <- 2014L
PRE_END    <- 2018L
EPA_START  <- 2019L
EPA_END    <- 2022L
CLEAN_START <- 2020L
CLEAN_END   <- 2024L

THRESH_A   <- 0.80
THRESH_B   <- 0.95
MIN_ABS_B  <- 1e6
SPIKE_YOY  <- 2.0
SPIKE_MIN  <- 1e6

TS_START   <- 2012L
TS_END     <- 2025L

# Country comparison charts — per-CN peer selection
# Logic: JP Japan is always included (EPA channel). KR South Korea is always
# included (comparable East Asian EPA partner, useful control). Remaining
# 3 peers chosen to maximise analytical contrast: largest volume market,
# a market with divergent post-2019 trend, and one geographic outlier.
# Source ranking: total 2012-2025 export volume from VKK30_44_71_84_85.xlsx.

CN_COMPARE_CODES <- c("CN44", "CN71", "CN84", "CN85")

CN_COMPARE_COUNTRIES <- list(

  # CN44 Wood: SE is #1 market by volume (~3.4B). DK chosen over FI because
  # DK diverges upward strongly post-2019 (+200 by 2022 vs FI +131),
  # making the JP ramp-up look less exceptional — honest control.
  # DE included as major western market with independent timber demand.
  # NO excluded (tracks SE almost exactly, adds no new information).
  CN44 = c("JP Japan", "SE Sweden", "DK Denmark", "DE Germany", "KR South Korea"),

  # CN71 Precious metals/jewellery: very different peer set from other CNs.
  # CH is the global jewellery hub — largest non-EU destination for Estonian
  # precious goods, index reaches 118 000 by 2024 (vs JP 11 000), confirms
  # the JP channel is real but not unique. SE included as largest EU market.
  # BG is surprising #1 by volume (755M) — likely re-export/transit node,
  # useful to show JP growth is not a transit artefact.
  # FI excluded (tracks SE closely). PL excluded (sharp spike then collapse,
  # distorts scale).
  CN71 = c("JP Japan", "CH Switzerland", "SE Sweden", "BG Bulgaria", "KR South Korea"),

  # CN84 Machinery: FI is dominant (#1 after RU which is excluded post-sanctions).
  # SE tracks FI almost exactly — dropped in favour of DE which shows a
  # distinctly different trajectory (steady +70% by 2023 vs FI +29%).
  # US included: sharp drop post-2019 is the clearest available counter-trend,
  # isolates Japan's spike as genuinely EPA-driven not sector-wide.
  CN84 = c("JP Japan", "FI Finland", "DE Germany", "US United States", "KR South Korea"),

  # CN85 Electronics: SE and FI kept together here — unusually they diverge
  # sharply (SE falls to 77 in 2019, FI stays flat at 100-141), which is
  # analytically important and justifies both lines.
  # US shows its own distinct arc (spike 2020-2021 then collapse).
  # CN China included: volume is real (756M), tracks SE decline, confirms
  # the JP post-2019 acceleration is Japan-specific not a global EE trend.
  CN85 = c("JP Japan", "SE Sweden", "FI Finland", "US United States", "CN China", "KR South Korea")
)

# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

clean_value <- function(x) suppressWarnings(as.numeric(ifelse(x == "..", NA, x)))

cagr <- function(end_val, start_val, n) {
  ifelse(
    is.na(end_val) | is.na(start_val) | start_val <= 0,
    NA_real_,
    round(((end_val / start_val)^(1 / n) - 1) * 100, 1)
  )
}

# ══════════════════════════════════════════════════════════════════════════════
# LOAD DATA
# ══════════════════════════════════════════════════════════════════════════════

years_jp  <- as.character(2004:2025)
years_tot <- as.character(2004:2025)
years_pow <- as.character(2020:2025)
years_cmp <- as.character(2012:2025)

raw_jp <- read_excel("clean_data/VKK30_JP.xlsx", skip = 2, col_names = FALSE)
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
  filter(flow %in% c("Export", "Import"), year <= TS_END)

raw_total <- read_excel("clean_data/VKK30_TOTAL.xlsx", skip = 2, col_names = FALSE)
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
  filter(year <= TS_END)

raw_pow <- read_excel("clean_data/VKK30_PARTS_OF_WORLD.xlsx", skip = 2, col_names = FALSE)
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
  filter(year <= TS_END)

# CN44/71/84/85 by individual country (source: VKK30_44_71_84_85.xlsx)
raw_cmp <- read_excel("clean_data/VKK30_44_71_84_85.xlsx", skip = 2, col_names = FALSE)
colnames(raw_cmp) <- c("flow", "commodity", "country", years_cmp)

cmp_long <- raw_cmp %>%
  fill(flow, commodity, .direction = "down") %>%
  filter(!is.na(country)) %>%
  pivot_longer(cols = all_of(years_cmp), names_to = "year", values_to = "value") %>%
  mutate(
    year    = as.integer(year),
    value   = clean_value(value),
    cn_code = str_extract(commodity, "^CN\\d+"),
    flow    = recode(flow,
                     "Exports"                      = "Export",
                     "Imports by country of origin" = "Import")
  ) %>%
  filter(flow == "Export",
         cn_code %in% CN_COMPARE_CODES,
         year >= TS_START, year <= TS_END,
         !is.na(value)) %>%
  # Apply per-CN country selection from CN_COMPARE_COUNTRIES list
  rowwise() %>%
  filter(country %in% CN_COMPARE_COUNTRIES[[cn_code]]) %>%
  ungroup()

# ══════════════════════════════════════════════════════════════════════════════
# PARETO CLASSIFICATION FUNCTION
# ══════════════════════════════════════════════════════════════════════════════

classify_pareto <- function(df, flow_type) {

  metrics <- df %>%
    filter(flow == flow_type, !is.na(value)) %>%
    group_by(cn_code, cn_name) %>%
    summarise(
      pre_mean      = mean(value[year >= PRE_START  & year <= PRE_END],  na.rm = TRUE),
      fta_mean      = mean(value[year >= EPA_START  & year <= EPA_END],  na.rm = TRUE),
      v_pre1        = mean(value[year == PRE_START], na.rm = TRUE),
      v2018         = mean(value[year == PRE_END],   na.rm = TRUE),
      v2019         = mean(value[year == EPA_START], na.rm = TRUE),
      v_epa_last    = mean(value[year == EPA_END],   na.rm = TRUE),
      v_clean_last  = mean(value[year == CLEAN_END], na.rm = TRUE),
      v_clean_first = mean(value[year == CLEAN_START], na.rm = TRUE),
      .groups = "drop"
    ) %>%
    mutate(
      abs_change = fta_mean - pre_mean,
      k          = fta_mean / pre_mean,
      yoy_18_19  = v2019 / v2018
    )

  no_trade <- metrics %>%
    filter(is.na(fta_mean) | fta_mean == 0) %>%
    mutate(pareto_group = "NoTrade")

  active   <- metrics %>% filter(!is.na(fta_mean), fta_mean > 0)
  growing  <- active  %>% filter(k >  1, abs_change > 0)
  declining <- active %>% filter(k <= 1 | abs_change <= 0)

  C3 <- sum(active$fta_mean,                        na.rm = TRUE)
  D4 <- sum(growing$abs_change[growing$abs_change > 0], na.rm = TRUE)

  growing_classified <- growing %>%
    mutate(
      share_fta   = fta_mean   / C3,
      share_delta = abs_change / D4,
      score       = (share_fta + share_delta) / 2
    ) %>%
    arrange(desc(score)) %>%
    mutate(cumul_score = cumsum(score) / sum(score)) %>%
    mutate(
      pareto_group = case_when(
        cumul_score <= THRESH_A                            ~ "A",
        cumul_score <= THRESH_B | abs_change >= MIN_ABS_B ~ "B",
        TRUE                                               ~ "Tail"
      )
    )

  spikes <- declining %>%
    filter(!is.na(yoy_18_19), yoy_18_19 >= SPIKE_YOY, fta_mean >= SPIKE_MIN) %>%
    mutate(share_fta = fta_mean / C3, share_delta = 0,
           score = share_fta / 2, cumul_score = NA_real_,
           pareto_group = "Spike")

  negative <- declining %>%
    filter(!(cn_code %in% spikes$cn_code)) %>%
    mutate(share_fta = fta_mean / C3, share_delta = 0,
           score = share_fta / 2, cumul_score = NA_real_,
           pareto_group = "Negative")

  result <- bind_rows(growing_classified, spikes, negative, no_trade) %>%
    mutate(C3 = C3, D4 = D4, flow = flow_type)

  list(data = result, C3 = C3, D4 = D4)
}

# ══════════════════════════════════════════════════════════════════════════════
# CLASSIFY BOTH FLOWS
# ══════════════════════════════════════════════════════════════════════════════

exp_result <- classify_pareto(jp_long, "Export")
imp_result <- classify_pareto(jp_long, "Import")

classified_exp <- exp_result$data
classified_imp <- imp_result$data

C3_EXP <- exp_result$C3 ; D4_EXP <- exp_result$D4
C3_IMP <- imp_result$C3 ; D4_IMP <- imp_result$D4

message(sprintf("Export  C3=%.0f  D4=%.0f", C3_EXP, D4_EXP))
message(sprintf("Import  C3=%.0f  D4=%.0f", C3_IMP, D4_IMP))

EXP_GROUP_A <- classified_exp %>% filter(pareto_group == "A")     %>% pull(cn_code)
EXP_GROUP_B <- classified_exp %>% filter(pareto_group == "B")     %>% pull(cn_code)
EXP_SPIKES  <- classified_exp %>% filter(pareto_group == "Spike") %>% pull(cn_code)
IMP_GROUP_A <- classified_imp %>% filter(pareto_group == "A")     %>% pull(cn_code)
IMP_GROUP_B <- classified_imp %>% filter(pareto_group == "B")     %>% pull(cn_code)

selected_cn_exp <- c(EXP_GROUP_A, EXP_GROUP_B, EXP_SPIKES)
selected_cn_imp <- c(IMP_GROUP_A, IMP_GROUP_B)

message("Export Group A: ", paste(EXP_GROUP_A, collapse = ", "))
message("Export Group B: ", paste(EXP_GROUP_B, collapse = ", "))
message("Export Spikes : ", paste(EXP_SPIKES,  collapse = ", "))
message("Import Group A: ", paste(IMP_GROUP_A, collapse = ", "))
message("Import Group B: ", paste(IMP_GROUP_B, collapse = ", "))

pareto_group_exp <- setNames(classified_exp$pareto_group, classified_exp$cn_code)
pareto_group_imp <- setNames(classified_imp$pareto_group, classified_imp$cn_code)

# ══════════════════════════════════════════════════════════════════════════════
# EPA SUMMARY TABLE
# ══════════════════════════════════════════════════════════════════════════════

jp_share <- jp_long %>%
  filter(cn_code %in% selected_cn_exp, !is.na(value)) %>%
  rename(value_jp = value) %>%
  left_join(total_long %>% select(cn_code, flow, year, value_world = value),
            by = c("cn_code", "flow", "year")) %>%
  mutate(jp_share_pct = 100 * value_jp / value_world)

build_epa_summary <- function(df, cn_codes, flow_type, c3_const, pg_map) {
  df %>%
    filter(cn_code %in% cn_codes, flow == flow_type, !is.na(value)) %>%
    group_by(cn_code, cn_name) %>%
    summarise(
      pre               = round(mean(value[year >= PRE_START  & year <= PRE_END],  na.rm = TRUE) / 1e6, 3),
      post              = round(mean(value[year >= EPA_START  & year <= EPA_END],  na.rm = TRUE) / 1e6, 3),
      avg_post_clean_mln = round(mean(value[year >= CLEAN_START & year <= CLEAN_END], na.rm = TRUE) / 1e6, 3),
      v_pre1 = mean(value[year == PRE_START],   na.rm = TRUE),
      v2018  = mean(value[year == PRE_END],     na.rm = TRUE),
      v2019  = mean(value[year == EPA_START],   na.rm = TRUE),
      v2020  = mean(value[year == CLEAN_START], na.rm = TRUE),
      v2023  = mean(value[year == EPA_END + 1], na.rm = TRUE),
      v2024  = mean(value[year == CLEAN_END],   na.rm = TRUE),
      .groups = "drop"
    ) %>%
    mutate(
      pct_change      = round((post - pre) / pre * 100, 0),
      direction       = if_else(post >= pre, "up", "down"),
      yoy_2018_2019   = round((v2019 - v2018) / v2018 * 100, 1),
      cagr_before_pct = cagr(v2018, v_pre1, PRE_END - PRE_START),
      cagr_after_pct  = cagr(v2023, v2019,  EPA_END - EPA_START),
      cagr_clean_pct  = cagr(v2024, v2020,  CLEAN_END - CLEAN_START),
      share_fta       = round(post * 1e6 / c3_const, 4),
      abs_change_mln  = round(post - pre, 3),
      pareto_group    = pg_map[cn_code]
    ) %>%
    select(-v_pre1, -v2018, -v2019, -v2020, -v2023, -v2024)
}

epa_summary_exports <- build_epa_summary(
  jp_long, selected_cn_exp, "Export", C3_EXP, pareto_group_exp
) %>%
  left_join(
    total_long %>%
      filter(cn_code %in% selected_cn_exp, flow == "Export", !is.na(value)) %>%
      group_by(cn_code) %>%
      summarise(
        world_pre  = mean(value[year >= PRE_START & year <= PRE_END], na.rm = TRUE),
        world_post = mean(value[year >= EPA_START & year <= EPA_END], na.rm = TRUE),
        .groups = "drop"
      ) %>%
      mutate(world_pct_change = round((world_post - world_pre) / world_pre * 100, 0)) %>%
      select(cn_code, world_pct_change),
    by = "cn_code"
  ) %>%
  mutate(sort_ord = case_when(pareto_group == "A" ~ 1, pareto_group == "B" ~ 2, TRUE ~ 3)) %>%
  arrange(sort_ord, desc(post)) %>%
  select(-sort_ord)

epa_summary_imports <- build_epa_summary(
  jp_long, selected_cn_imp, "Import", C3_IMP, pareto_group_imp
) %>%
  mutate(sort_ord = case_when(pareto_group == "A" ~ 1, pareto_group == "B" ~ 2, TRUE ~ 3)) %>%
  arrange(sort_ord, desc(post)) %>%
  select(-sort_ord)

pareto_summary <- epa_summary_exports %>%
  filter(!is.na(pareto_group), pareto_group %in% c("A", "B", "Spike")) %>%
  group_by(pareto_group) %>%
  summarise(
    n_groups       = n(),
    avg_pre        = round(mean(pre,        na.rm = TRUE), 3),
    avg_post       = round(mean(post,       na.rm = TRUE), 3),
    avg_pct_change = round(mean(pct_change, na.rm = TRUE), 1),
    .groups = "drop"
  )

# ══════════════════════════════════════════════════════════════════════════════
# INDEX VS 2018
# ══════════════════════════════════════════════════════════════════════════════

index_vs_2018 <- jp_long %>%
  filter(cn_code %in% selected_cn_exp, flow == "Export", !is.na(value)) %>%
  group_by(cn_code) %>%
  mutate(
    base_jp   = mean(value[year == PRE_END], na.rm = TRUE),
    idx_japan = round(100 * value / base_jp, 1)
  ) %>%
  ungroup() %>%
  left_join(
    total_long %>%
      filter(cn_code %in% selected_cn_exp, flow == "Export") %>%
      group_by(cn_code) %>%
      mutate(
        base_world = mean(value[year == PRE_END], na.rm = TRUE),
        idx_world  = round(100 * value / base_world, 1)
      ) %>%
      ungroup() %>%
      select(cn_code, year, idx_world),
    by = c("cn_code", "year")
  ) %>%
  filter(year >= TS_START, year <= TS_END) %>%
  transmute(year, cn_code, flow = "Export", idx_japan, idx_world)

# ══════════════════════════════════════════════════════════════════════════════
# COUNTRY COMPARISON (CN44/71/84/85 × SE/FI/DE/KR/CN/JP)
# ══════════════════════════════════════════════════════════════════════════════

country_cn_comparison <- cmp_long %>%
  transmute(year, cn_code, country, value_mln = round(value / 1e6, 3)) %>%
  arrange(cn_code, country, year)

country_cn_index <- country_cn_comparison %>%
  group_by(cn_code, country) %>%
  mutate(
    base_2018 = value_mln[year == PRE_END][1],
    index     = round(100 * value_mln / base_2018, 1),
    is_japan  = (country == "JP Japan")
  ) %>%
  filter(!is.na(base_2018), !is.na(index)) %>%
  ungroup() %>%
  select(year, cn_code, country, index, is_japan) %>%
  arrange(cn_code, country, year)

message(sprintf("✓ country_cn_comparison: %d rows", nrow(country_cn_comparison)))
message(sprintf("✓ country_cn_index:      %d rows", nrow(country_cn_index)))

# ══════════════════════════════════════════════════════════════════════════════
# JSON EXPORT
# ══════════════════════════════════════════════════════════════════════════════

dir.create("data", showWarnings = FALSE)

commodities_json <- list(

  exports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn_exp, flow == "Export",
           year >= TS_START, year <= TS_END) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),

  imports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn_imp, flow == "Import",
           year >= TS_START, year <= TS_END) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),

  spike_timeseries = jp_long %>%
    filter(cn_code %in% EXP_SPIKES, flow == "Export",
           year >= TS_START, year <= TS_END) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),

  share = jp_share %>%
    filter(flow == "Export", cn_code %in% selected_cn_exp,
           year >= TS_START, year <= TS_END) %>%
    transmute(year, cn_code, jp_share_pct = round(jp_share_pct, 2)),

  epa_comparison         = epa_summary_exports,
  epa_comparison_imports = epa_summary_imports,
  pareto_summary         = pareto_summary,

  pareto_constants = list(
    period      = sprintf("SHORT: %d-%d vs %d-%d", PRE_START, PRE_END, EPA_START, EPA_END),
    thresh_a    = THRESH_A,
    thresh_b    = THRESH_B,
    min_abs_b   = MIN_ABS_B,
    spike_yoy   = SPIKE_YOY,
    spike_min   = SPIKE_MIN,
    C3_exp      = round(C3_EXP),
    D4_exp      = round(D4_EXP),
    C3_imp      = round(C3_IMP),
    D4_imp      = round(D4_IMP),
    exp_group_A = EXP_GROUP_A,
    exp_group_B = EXP_GROUP_B,
    exp_spikes  = EXP_SPIKES,
    imp_group_A = IMP_GROUP_A,
    imp_group_B = IMP_GROUP_B
  ),

  index_vs_2018 = index_vs_2018,

  regional = pow_long %>%
    filter(cn_code %in% c("CN03", "CN44"), flow == "Export", !is.na(value)) %>%
    transmute(year, cn_code, region, value = round(value / 1e6, 3)),

  world_exports_timeseries = total_long %>%
    filter(cn_code %in% selected_cn_exp, flow == "Export",
           year >= TS_START, year <= TS_END) %>%
    transmute(year, cn_code, cn_name, value = round(value / 1e6, 3)),

  country_cn_comparison = country_cn_comparison,
  country_cn_index      = country_cn_index
)

write_json(commodities_json, "data/commodities.json", pretty = TRUE, auto_unbox = TRUE)
message("✓ data/commodities.json written — Pareto auto-classification v21")
