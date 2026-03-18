# PURPOSE : Estonia ↔ Japan trade by CN commodity groups — Pareto classification
#           Charts + JSON export for HTML dashboard
#
# METHODOLOGY (v21):
#   Composite score = avg(share_FTA, share_Δ)
#   share_FTA = fta_mean / C3    (share of ALL bilateral trade)
#   share_Δ   = abs_change / D4  (share of growing trade increment, k>1 only)
#
#   Group A  — cumul score ≤ 80%
#   Group B  — score 80–95% OR abs_change ≥ 1,000,000 EUR
#   Spike    — k≤1 but YoY 2018→19 ≥ 2x AND fta_mean ≥ 1M EUR
#
#   SHORT period: PRE=2014–2018 vs EPA=2019–2022
#
#   Removed vs previous version:
#     - control_vs_treatment (subjective division)
#     - z_score block
#   Added:
#     - pareto_group, share_fta, abs_change_mln fields
#     - spike_timeseries block

library(readxl)
library(tidyverse)
library(scales)
library(ggrepel)
library(jsonlite)

# ── PARETO CONSTANTS (SHORT period — matches FTA_v21_short.xlsx C3/D4) ────────
C3_EXP <- 110592002   # sum fta_mean all CN export groups
D4_EXP <-  43970469   # sum abs_change, growing (k>1) export groups
C3_IMP <- 304764588
D4_IMP <-  99910227

# ── GROUP ASSIGNMENTS (from FTA_v21_short.xlsx Pareto classification) ─────────
EXP_GROUP_A <- c("CN44","CN85","CN71","CN84")
EXP_GROUP_B <- c("CN08","CN90","CN72","CN28","CN94")
EXP_SPIKES  <- c("CN81","CN03")
IMP_GROUP_A <- c("CN87","CN84")
IMP_GROUP_B <- c("CN90","CN85","CN32","CN82","CN81","CN95")
IMP_SPIKES  <- character(0)

selected_cn_exp <- c(EXP_GROUP_A, EXP_GROUP_B, EXP_SPIKES)
selected_cn_imp <- c(IMP_GROUP_A, IMP_GROUP_B)

pareto_group_exp <- setNames(
  c(rep("A",length(EXP_GROUP_A)), rep("B",length(EXP_GROUP_B)), rep("Spike",length(EXP_SPIKES))),
  c(EXP_GROUP_A, EXP_GROUP_B, EXP_SPIKES))
pareto_group_imp <- setNames(
  c(rep("A",length(IMP_GROUP_A)), rep("B",length(IMP_GROUP_B))),
  c(IMP_GROUP_A, IMP_GROUP_B))

# ── SHARED AESTHETICS ──────────────────────────────────────────────────────────
event_lines <- list(
  geom_vline(xintercept=2019,linetype="dashed", colour="#c0392b",linewidth=0.8),
  geom_vline(xintercept=2020,linetype="dotted", colour="#e67e22",linewidth=0.8),
  geom_vline(xintercept=2022,linetype="dotdash",colour="#7f8c8d",linewidth=0.8),
  annotate("text",x=2019.15,y=Inf,label="EPA 2019",hjust=0,vjust=1.6,colour="#c0392b",size=3.2),
  annotate("text",x=2020.15,y=Inf,label="COVID-19",hjust=0,vjust=1.6,colour="#e67e22",size=3.2),
  annotate("text",x=2022.15,y=Inf,label="War 2022",hjust=0,vjust=1.6,colour="#7f8c8d",size=3.2)
)
theme_trade <- theme_minimal(base_size=12)+theme(legend.position="bottom",panel.grid.minor=element_blank(),plot.subtitle=element_text(color="grey50",size=11))
clean_value <- function(x) suppressWarnings(as.numeric(ifelse(x=="...",NA,x)))

# ── LOAD DATA ──────────────────────────────────────────────────────────────────
raw_jp <- read_excel("clean_data/VKK30_JP.xlsx",skip=2,col_names=FALSE)
years_jp <- as.character(2004:2025)
colnames(raw_jp) <- c("flow","commodity","country",years_jp)
jp_long <- raw_jp %>%
  fill(flow,.direction="down") %>% filter(!is.na(commodity)) %>% select(-country) %>%
  pivot_longer(cols=all_of(years_jp),names_to="year",values_to="value") %>%
  mutate(year=as.integer(year),value=clean_value(value),
         cn_code=str_extract(commodity,"^CN\\d+"),
         cn_name=str_trim(str_replace(commodity,"^CN\\d+\\s*","")),
         flow=recode(flow,"Exports"="Export","Imports by country of origin"="Import")) %>%
  filter(flow %in% c("Export","Import"),year<=2025)

raw_pow <- read_excel("clean_data/VKK30_PARTS_OF_WORLD.xlsx",skip=2,col_names=FALSE)
years_pow <- as.character(2020:2025)
colnames(raw_pow) <- c("flow","commodity","region",years_pow)
pow_long <- raw_pow %>%
  fill(flow,commodity,.direction="down") %>% filter(!is.na(region)) %>%
  pivot_longer(cols=all_of(years_pow),names_to="year",values_to="value") %>%
  mutate(year=as.integer(year),value=clean_value(value),
         cn_code=str_extract(commodity,"^CN\\d+"),
         cn_name=str_trim(str_replace(commodity,"^CN\\d+\\s*","")),
         flow=recode(flow,"Exports"="Export","Imports by country of origin"="Import")) %>%
  filter(year<=2025)

raw_total <- read_excel("clean_data/VKK30_TOTAL.xlsx",skip=2,col_names=FALSE)
years_tot <- as.character(2004:2025)
colnames(raw_total) <- c("flow","commodity",years_tot)
total_long <- raw_total %>%
  fill(flow,.direction="down") %>% filter(!is.na(commodity)) %>%
  pivot_longer(cols=all_of(years_tot),names_to="year",values_to="value") %>%
  mutate(year=as.integer(year),value=clean_value(value),
         cn_code=str_extract(commodity,"^CN\\d+"),
         cn_name=str_trim(str_replace(commodity,"^CN\\d+\\s*","")),
         flow=recode(flow,"Exports"="Export","Imports by country of origin"="Import")) %>%
  filter(year<=2025)

# ── ANALYTICAL DATASETS ────────────────────────────────────────────────────────
jp_share <- jp_long %>%
  filter(cn_code %in% selected_cn_exp,!is.na(value)) %>% rename(value_jp=value) %>%
  left_join(total_long %>% select(cn_code,flow,year,value_world=value),by=c("cn_code","flow","year")) %>%
  mutate(jp_share_pct=100*value_jp/value_world)

cagr <- function(end_val,start_val,n) {
  ifelse(is.na(end_val)|is.na(start_val)|start_val<=0,NA_real_,round(((end_val/start_val)^(1/n)-1)*100,1))
}

build_epa_summary <- function(df, cn_codes, flow_type, c3_const, pg_map) {
  df %>%
    filter(cn_code %in% cn_codes,flow==flow_type,!is.na(value)) %>%
    group_by(cn_code,cn_name) %>%
    summarise(
      pre=round(mean(value[year>=2014&year<=2018],na.rm=TRUE)/1e6,3),
      post=round(mean(value[year>=2019&year<=2022],na.rm=TRUE)/1e6,3),
      avg_post_clean_mln=round(mean(value[year>=2020&year<=2024],na.rm=TRUE)/1e6,3),
      v2014=mean(value[year==2014],na.rm=TRUE), v2018=mean(value[year==2018],na.rm=TRUE),
      v2019=mean(value[year==2019],na.rm=TRUE), v2020=mean(value[year==2020],na.rm=TRUE),
      v2023=mean(value[year==2023],na.rm=TRUE), v2024=mean(value[year==2024],na.rm=TRUE),
      .groups="drop") %>%
    mutate(
      pct_change=round((post-pre)/pre*100,0),
      direction=if_else(post>=pre,"up","down"),
      yoy_2018_2019=round((v2019-v2018)/v2018*100,1),
      cagr_before_pct=cagr(v2018,v2014,4), cagr_after_pct=cagr(v2023,v2019,4),
      cagr_clean_pct=cagr(v2024,v2020,4),
      share_fta=round(post*1e6/c3_const,4),
      abs_change_mln=round(post-pre,3),
      pareto_group=pg_map[cn_code]
    ) %>%
    select(-v2014,-v2018,-v2019,-v2020,-v2023,-v2024)
}

epa_summary_exports <- build_epa_summary(jp_long,selected_cn_exp,"Export",C3_EXP,pareto_group_exp)
world_pct_exp <- total_long %>%
  filter(cn_code %in% selected_cn_exp,flow=="Export",!is.na(value)) %>%
  group_by(cn_code) %>%
  summarise(world_pre=mean(value[year>=2014&year<=2018],na.rm=TRUE),
            world_post=mean(value[year>=2019&year<=2022],na.rm=TRUE),.groups="drop") %>%
  mutate(world_pct_change=round((world_post-world_pre)/world_pre*100,0)) %>%
  select(cn_code,world_pct_change)
epa_summary_exports <- epa_summary_exports %>%
  left_join(world_pct_exp,by="cn_code") %>%
  mutate(sort_ord=case_when(pareto_group=="A"~1,pareto_group=="B"~2,TRUE~3)) %>%
  arrange(sort_ord,desc(post)) %>% select(-sort_ord)

epa_summary_imports <- build_epa_summary(jp_long,selected_cn_imp,"Import",C3_IMP,pareto_group_imp) %>%
  mutate(sort_ord=case_when(pareto_group=="A"~1,pareto_group=="B"~2,TRUE~3)) %>%
  arrange(sort_ord,desc(post)) %>% select(-sort_ord)

pareto_summary <- epa_summary_exports %>%
  filter(!is.na(pareto_group)) %>% group_by(pareto_group) %>%
  summarise(n_groups=n(),avg_pre=round(mean(pre,na.rm=TRUE),3),
            avg_post=round(mean(post,na.rm=TRUE),3),
            avg_pct_change=round(mean(pct_change,na.rm=TRUE),1),.groups="drop")

# ── PLOTS ──────────────────────────────────────────────────────────────────────
p1 <- jp_long %>%
  filter(cn_code %in% c(EXP_GROUP_A,EXP_GROUP_B),flow=="Export",!is.na(value)) %>%
  mutate(line_group=if_else(cn_code %in% EXP_GROUP_A,"A","B")) %>%
  ggplot(aes(x=year,y=value/1e6,colour=cn_code,linetype=line_group))+event_lines+
  geom_line(linewidth=1.1,na.rm=TRUE)+geom_point(size=1.8,na.rm=TRUE)+
  scale_linetype_manual(values=c("A"="solid","B"="dashed"),name="Group")+
  scale_x_continuous(breaks=seq(2004,2024,4))+scale_y_continuous(labels=label_comma(suffix=" M€"))+
  labs(title="Estonia→Japan: exports by CN group (Pareto A+B)",
       subtitle="Solid=Group A | Dashed=Group B | million EUR",x=NULL,y="Million EUR",colour=NULL)+theme_trade
print(p1)

p_spike <- jp_long %>%
  filter(cn_code %in% EXP_SPIKES,flow=="Export",!is.na(value)) %>%
  ggplot(aes(x=year,y=value/1e6,colour=cn_code))+event_lines+
  geom_line(linewidth=1.1,na.rm=TRUE)+geom_point(size=2,na.rm=TRUE)+
  scale_x_continuous(breaks=seq(2004,2024,4))+scale_y_continuous(labels=label_comma(suffix=" M€"))+
  labs(title="Export spikes: CN03 Fish + CN81 Base metals",
       subtitle="Strong 2019 EPA reaction — no sustained growth (k<1)",x=NULL,y="Million EUR",colour=NULL)+theme_trade
print(p_spike)

p2 <- jp_long %>%
  filter(cn_code %in% c(IMP_GROUP_A,IMP_GROUP_B),flow=="Import",!is.na(value)) %>%
  mutate(line_group=if_else(cn_code %in% IMP_GROUP_A,"A","B")) %>%
  ggplot(aes(x=year,y=value/1e6,colour=cn_code,linetype=line_group))+event_lines+
  geom_line(linewidth=1.1,na.rm=TRUE)+geom_point(size=1.8,na.rm=TRUE)+
  scale_linetype_manual(values=c("A"="solid","B"="dashed"),name="Group")+
  scale_x_continuous(breaks=seq(2004,2024,4))+scale_y_continuous(labels=label_comma(suffix=" M€"))+
  labs(title="Japan→Estonia: imports by CN group (Pareto A+B)",
       subtitle="Solid=Group A | Dashed=Group B | million EUR",x=NULL,y="Million EUR",colour=NULL)+theme_trade
print(p2)

p3 <- jp_share %>%
  filter(flow=="Export",cn_code %in% EXP_GROUP_A) %>%
  ggplot(aes(x=year,y=jp_share_pct,colour=cn_code))+event_lines+
  geom_line(linewidth=1.1,na.rm=TRUE)+geom_point(size=1.8,na.rm=TRUE)+
  scale_x_continuous(breaks=seq(2004,2024,4))+
  scale_y_continuous(labels=label_percent(scale=1,accuracy=0.1))+
  labs(title="Japan's share in Estonia's total exports — Group A",x=NULL,y="%",colour=NULL)+theme_trade
print(p3)

p4 <- pow_long %>%
  filter(cn_code %in% c("CN03","CN44"),flow=="Export",!is.na(value)) %>%
  mutate(cn_label=recode(cn_code,"CN03"="CN03 Fish","CN44"="CN44 Wood"),
         region=factor(region,levels=c("EUR Europe","ASI Asia","AME America","AFR Africa","JP Japan"))) %>%
  ggplot(aes(x=factor(year),y=value/1e6,fill=region))+geom_col(position="stack")+
  facet_wrap(~cn_label,scales="free_y")+scale_fill_brewer(palette="Set2",name="Region")+
  labs(title="Export by region: CN03 Fish vs CN44 Wood",x=NULL,y="Million EUR")+
  theme_trade+theme(axis.text.x=element_text(angle=45,hjust=1))
print(p4)

# ── JSON EXPORT ────────────────────────────────────────────────────────────────
dir.create("data",showWarnings=FALSE)
commodities_json <- list(
  exports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn_exp,flow=="Export",year>=2012,year<=2025) %>%
    transmute(year,cn_code,cn_name,value=round(value/1e6,3)),
  imports_timeseries = jp_long %>%
    filter(cn_code %in% selected_cn_imp,flow=="Import",year>=2012,year<=2025) %>%
    transmute(year,cn_code,cn_name,value=round(value/1e6,3)),
  spike_timeseries = jp_long %>%
    filter(cn_code %in% EXP_SPIKES,flow=="Export",year>=2012,year<=2025) %>%
    transmute(year,cn_code,cn_name,value=round(value/1e6,3)),
  share = jp_share %>%
    filter(flow=="Export",cn_code %in% selected_cn_exp,year>=2012,year<=2025) %>%
    transmute(year,cn_code,jp_share_pct=round(jp_share_pct,2)),
  epa_comparison = epa_summary_exports,
  epa_comparison_imports = epa_summary_imports,
  pareto_summary = pareto_summary,
  pareto_constants = list(
    period="SHORT: 2014-2018 vs 2019-2022",
    C3_exp=C3_EXP, D4_exp=D4_EXP, C3_imp=C3_IMP, D4_imp=D4_IMP,
    exp_group_A=EXP_GROUP_A, exp_group_B=EXP_GROUP_B, exp_spikes=EXP_SPIKES,
    imp_group_A=IMP_GROUP_A, imp_group_B=IMP_GROUP_B),
  regional = pow_long %>%
    filter(cn_code %in% c("CN03","CN44"),flow=="Export",!is.na(value)) %>%
    transmute(year,cn_code,region,value=round(value/1e6,3)),
  world_exports_timeseries = total_long %>%
    filter(cn_code %in% selected_cn_exp,flow=="Export",year>=2012,year<=2025) %>%
    transmute(year,cn_code,cn_name,value=round(value/1e6,3))
)
write_json(commodities_json,"data/commodities.json",pretty=TRUE,auto_unbox=TRUE)
message("✓ data/commodities.json written — Pareto methodology v21")
