# Köppen–Geiger Climate Classification

This document provides a concise technical reference for the Köppen–Geiger climate classification system, including major groups, sub‑types, and defining thresholds.

## 1. Overview

The Köppen–Geiger system classifies global climates using long‑term averages of monthly temperature and precipitation. It organizes climates into hierarchical categories based on vegetation relevance and seasonal moisture/temperature patterns.

Primary required metrics:
- Monthly mean temperature (T₁..T₁₂)
- Monthly precipitation (P₁..P₁₂)
- Derived metrics such as:
  - Annual mean temperature (T_ann)
  - Temperature of warmest/coldest month
  - Annual precipitation (P_ann)
  - Seasonal precipitation totals (summer vs. winter)

## 2. Major Climate Groups

### A: Tropical
- **Definition**: T_coldest ≥ 18°C  
- **Subtypes**:
  - **Af**: Tropical rainforest  
    - P_min ≥ 60 mm
  - **Am**: Tropical monsoon  
    - P_min < 60 mm  
    - P_min ≥ 100 − (P_ann / 25)
  - **Aw/As**: Tropical savanna  
    - P_min < 60 mm  
    - P_min < 100 − (P_ann / 25)

### B: Dry
Defined using precipitation threshold:
P_threshold = 20 × T_ann  
Add:  
+280 mm if 70 percent of precipitation occurs in winter  
+140 mm if 70 percent occurs in summer  

- **BW**: Arid desert  
  - P_ann < 0.5 × P_threshold
- **BS**: Semi‑arid steppe  
  - 0.5 × P_threshold ≤ P_ann < P_threshold

Subdivisions by temperature:
- **h**: Hot (T_ann ≥ 18°C)
- **k**: Cold (T_ann < 18°C)

### C: Temperate (Mesothermal)
- **Definition**: −3°C < T_coldest < 18°C  
- **Subtypes**:
  - **Cfa/Cwa/Csa**: Differ by seasonal precipitation pattern  
  - **Cfb/Cwc**: Marine or weakly seasonal  
  - **Cfc**: Cold-summer oceanic

### D: Continental (Microthermal)
- **Definition**: T_coldest ≤ −3°C and T_warmest > 10°C  
- **Subtypes**:
  - **Dfa/Dwa/Dsa**
  - **Dfb/Dwb/Dsb**
  - **Dfc/Dwc/Dsc**
  - **Dfd/Dwd/Dsd**

### E: Polar
- **ET**: T_warmest between 0°C and 10°C (Tundra)  
- **EF**: T_warmest < 0°C (Ice cap)

## 3. Seasonal Definitions
Hemispheric season alignment:  
- **Northern Hemisphere**: summer = Apr–Sep, winter = Oct–Mar  
- **Southern Hemisphere**: summer = Oct–Mar, winter = Apr–Sep

## 4. Required Derived Metrics
For implementing Köppen computationally:
- T_ann = mean(T₁..T₁₂)
- T_warmest = max(T₁..T₁₂)
- T_coldest = min(T₁..T₁₂)
- P_ann = sum(P₁..P₁₂)
- P_summer / P_winter based on hemisphere
- P_threshold adjustments for Group B rules

## 5. Implementation Notes
- The classification is hierarchical: evaluate major group → precipitation subtype → temperature subtype.  
- Rule conflicts are resolved by specificity (deepest valid subtype).  
- Real‑world datasets may require smoothing or interpolation for coastal cells.

This Markdown file is intended as a starting technical reference for system designers and users creating custom rule sets based on Köppen–Geiger.
