---
stepsCompleted: [1]
research_type: 'technical'
research_topic: 'Koppen climate visualization tool - data, classification, libraries, monetization'
research_goals: 'Validate ECMWF data choice, document Köppen rules, evaluate visualization libraries, research donation methods'
date: '2025-12-05'
current_year: '2025'
web_research_enabled: true
source_verification: true
---

# Koppen Technical Research

**Researcher:** NPope97
**Date:** 2025-12-05
**Focus Areas:** Climate data sources, Köppen-Geiger classification rules, Python visualization libraries, Donation/monetization methods

---

## Executive Summary

This research validates the technical choices for the Koppen climate visualization tool and documents key implementation details. Key findings:

1. **ECMWF ERA5 is an excellent choice** - 0.25° resolution, monthly data available, multiple access methods including Python API
2. **Köppen-Geiger rules are well-documented** - Beck et al. (2018) provides the definitive modern reference with complete thresholds
3. **Folium is the recommended Python mapping library** - Wraps Leaflet.js, excellent Python integration, supports GeoJSON/choropleths
4. **Ko-fi recommended for donations** - 0% fee on tips, simple integration, no account needed for donors

---

## 1. Climate Data Source: ECMWF ERA5

### Validation of Your Choice

Your proposed approach (ECMWF monthly means, 30-year averages, 0.25° resolution) is **well-supported**.

### ERA5 Specifications

| Attribute | Value |
|-----------|-------|
| **Spatial Resolution** | 0.25° × 0.25° (atmosphere), ~28km at equator |
| **Temporal Coverage** | 1940-01-01 to present (updated daily, ~5 day latency) |
| **Monthly Means** | Available around 6th of each month |
| **Format** | CF-compliant NetCDF4 |
| **Climate Normal Period** | WMO recommends 1991-2020 |

### Access Methods

1. **Copernicus Climate Data Store (CDS) API** - Primary method
   - Register at CDS, get API key
   - Python package: `cdsapi`
   - Can request specific variables, time ranges, regions

2. **Google Earth Engine** - Pre-aggregated monthly data
   - Dataset: `ECMWF/ERA5/MONTHLY`
   - Good for quick prototyping

3. **AWS Open Data** - Full NetCDF4 archive
   - NSF NCAR provides structured 0.25° ERA5
   - Good for bulk downloads

### Required Variables for Köppen Classification

- `2m_temperature` (monthly mean)
- `total_precipitation` (monthly total)

### Implementation Notes

- ERA5-Land offers higher resolution (0.1°) but may be overkill for MVP
- Pre-compute 30-year averages offline, serve as static JSON/GeoJSON
- Consider caching computed classifications rather than raw climate data

### Sources

- [ERA5 Monthly Aggregates - Google Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_MONTHLY)
- [How to Download ERA5 - ECMWF Confluence](https://confluence.ecmwf.int/display/CKB/How+to+download+ERA5)
- [ECMWF ERA5 on AWS](https://registry.opendata.aws/ecmwf-era5/)
- [NSF NCAR ERA5 on AWS](https://registry.opendata.aws/nsf-ncar-era5/)

---

## 2. Köppen-Geiger Classification Rules

### Definitive Reference

**Beck et al. (2018)** - "Present and future Köppen-Geiger climate classification maps at 1-km resolution" is the most cited modern reference.

- Published in *Scientific Data*
- DOI: 10.1038/sdata.2018.214
- Includes Matlab implementation code (KoppenGeiger.m)
- Uses updated thresholds (0°C instead of -3°C for C/D boundary)

### Complete Classification Rules

#### Required Derived Metrics

From monthly temperature (T₁...T₁₂) and precipitation (P₁...P₁₂):

- **MAT** = Mean Annual Temperature = mean(T₁...T₁₂)
- **Tmax** = Temperature of warmest month = max(T₁...T₁₂)
- **Tmin** = Temperature of coldest month = min(T₁...T₁₂)
- **MAP** = Mean Annual Precipitation = sum(P₁...P₁₂)
- **Pdry** = Precipitation of driest month = min(P₁...P₁₂)
- **Psdry** = Precipitation of driest summer month
- **Pwdry** = Precipitation of driest winter month
- **Pswet** = Precipitation of wettest summer month
- **Pwwet** = Precipitation of wettest winter month

**Hemisphere Definition:**
- Northern: Summer = Apr-Sep, Winter = Oct-Mar
- Southern: Summer = Oct-Mar, Winter = Apr-Sep

#### Precipitation Threshold (Pthreshold) for B Climates

```
If ≥70% of MAP falls in summer:
    Pthreshold = 2 × MAT + 28

If ≥70% of MAP falls in winter:
    Pthreshold = 2 × MAT

Otherwise:
    Pthreshold = 2 × MAT + 14
```

(Note: Some sources multiply by 10 and use different constants - Beck uses the above)

#### Main Climate Groups

| Group | Name | Criterion |
|-------|------|-----------|
| **A** | Tropical | Tmin ≥ 18°C |
| **B** | Arid | MAP < Pthreshold |
| **C** | Temperate | Tmin > 0°C AND Tmin < 18°C AND Tmax ≥ 10°C |
| **D** | Continental | Tmin ≤ 0°C AND Tmax ≥ 10°C |
| **E** | Polar | Tmax < 10°C |

#### Tropical (A) Subtypes

| Code | Name | Criterion |
|------|------|-----------|
| **Af** | Tropical Rainforest | Pdry ≥ 60mm |
| **Am** | Tropical Monsoon | Pdry < 60mm AND Pdry ≥ (100 - MAP/25) |
| **Aw/As** | Tropical Savanna | Pdry < 60mm AND Pdry < (100 - MAP/25) |

#### Arid (B) Subtypes

| Code | Name | Criterion |
|------|------|-----------|
| **BW** | Desert | MAP < 0.5 × Pthreshold |
| **BS** | Steppe | MAP ≥ 0.5 × Pthreshold (but still < Pthreshold) |
| **h** | Hot | MAT ≥ 18°C |
| **k** | Cold | MAT < 18°C |

Full codes: BWh, BWk, BSh, BSk

#### Temperate (C) & Continental (D) Subtypes

**Second letter - Precipitation pattern:**

| Letter | Name | Criterion |
|--------|------|-----------|
| **s** | Dry Summer | Psdry < 40mm AND Psdry < Pwwet/3 |
| **w** | Dry Winter | Pwdry < Pswet/10 |
| **f** | No Dry Season | Neither s nor w |

**Third letter - Temperature:**

| Letter | Name | Criterion |
|--------|------|-----------|
| **a** | Hot Summer | Tmax ≥ 22°C |
| **b** | Warm Summer | Tmax < 22°C AND ≥4 months with T > 10°C |
| **c** | Cold Summer | Tmax < 22°C AND <4 months with T > 10°C AND Tmin > -38°C |
| **d** | Very Cold Winter | Tmin ≤ -38°C (D climates only) |

Full C codes: Cfa, Cfb, Cfc, Csa, Csb, Csc, Cwa, Cwb, Cwc
Full D codes: Dfa, Dfb, Dfc, Dfd, Dsa, Dsb, Dsc, Dsd, Dwa, Dwb, Dwc, Dwd

#### Polar (E) Subtypes

| Code | Name | Criterion |
|------|------|-----------|
| **ET** | Tundra | 0°C ≤ Tmax < 10°C |
| **EF** | Ice Cap | Tmax < 0°C |

### Decision Tree Order

Per Beck et al., evaluate in this order:
1. Check E (polar) first
2. Check B (arid) second
3. Check A (tropical) third
4. Remaining is C or D based on Tmin threshold

### Implementation Resources

- [Beck et al. 2018 - Scientific Data](https://www.nature.com/articles/sdata2018214)
- [GitHub: salvah22/koppenclassification](https://github.com/salvah22/koppenclassification) - Python implementation
- [Vienna University Köppen-Geiger Maps](http://koeppen-geiger.vu-wien.ac.at/)
- [NOAA JetStream - Köppen Subdivisions](https://www.noaa.gov/jetstream/global/climate-zones/jetstream-max-addition-k-ppen-geiger-climate-subdivisions)

---

## 3. Python Visualization Libraries

### Recommendation: Folium

**Folium** is the best fit for your requirements:
- Python wrapper for Leaflet.js
- Clean 2D maps (no 3D complexity)
- Excellent GeoJSON/choropleth support
- Works with Flask/FastAPI backends

### Folium Overview

| Attribute | Details |
|-----------|---------|
| **Current Version** | 0.20.0 |
| **JS Library** | Leaflet.js |
| **Output** | Interactive HTML maps |
| **Tile Providers** | OpenStreetMap, Mapbox, CartoDB, custom |

### Key Features for Koppen

- **Choropleth maps** - Color regions by climate type
- **GeoJSON overlays** - Display climate zone boundaries
- **Popup/tooltip support** - Click for details, hover for previews
- **Zoom/pan** - Built-in interactivity
- **Tile flexibility** - Switch between base maps

### Code Example

```python
import folium

# Create base map
m = folium.Map(location=[0, 0], zoom_start=2, tiles='CartoDB positron')

# Add climate zones as GeoJSON choropleth
folium.GeoJson(
    climate_geojson,
    style_function=lambda feature: {
        'fillColor': get_climate_color(feature['properties']['climate_type']),
        'color': 'black',
        'weight': 0.5,
        'fillOpacity': 0.7
    },
    tooltip=folium.GeoJsonTooltip(fields=['climate_type', 'description'])
).add_to(m)

m.save('koppen_map.html')
```

### Alternative Libraries Considered

| Library | Pros | Cons |
|---------|------|------|
| **Folium** | Python-native, Leaflet.js, easy | Generates static HTML (needs reload for updates) |
| **Plotly/Dash** | Interactive, callbacks | Heavier, more complex |
| **ipyleaflet** | Jupyter integration | Less suited for web deployment |
| **Bokeh** | Good interactivity | Less map-focused |

### Backend Framework: FastAPI or Flask

For serving the map:

| Framework | Best For |
|-----------|----------|
| **Flask** | Simpler MVP, full control, familiar |
| **FastAPI** | Higher performance, async, modern |

**Recommendation:** Start with Flask for MVP simplicity. Migrate to FastAPI if needed for scale.

### Architecture Options

**Option A: Pre-generated Static Maps**
- Generate HTML maps at build time
- Serve as static files (cheap hosting)
- Classification builder generates new HTML client-side

**Option B: Dynamic API**
- FastAPI/Flask serves climate data as JSON
- Frontend (vanilla JS or lightweight framework) renders with Leaflet directly
- More flexible, supports URL-encoded rules

**Recommendation for MVP:** Option B - serve pre-computed climate grid as GeoJSON, render with Leaflet.js directly in browser. Python backend only needed for:
- Serving static data files
- (Future) Computing custom classifications on-demand

### Sources

- [Folium Documentation](https://python-visualization.github.io/folium/latest/)
- [Folium on PyPI](https://pypi.org/project/folium/)
- [Real Python - Folium Tutorial](https://realpython.com/python-folium-web-maps-from-data/)
- [Earth Data Science - Leaflet/Folium](https://earthdatascience.org/tutorials/introduction-to-leaflet-animated-maps/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

## 4. Donation/Tip Jar Methods

### Recommendation: Ko-fi (Free Tier)

For a donation-first MVP, **Ko-fi** offers the best value:

| Platform | Platform Fee | Payment Processing | Best For |
|----------|--------------|---------------------|----------|
| **Ko-fi (Free)** | 0% on donations | PayPal/Stripe fees only | Simple tip jar |
| **Buy Me a Coffee** | 5% on everything | + Stripe fees | Quick setup |
| **Direct Stripe** | 0% | 2.9% + $0.30 | Full control |
| **Ko-fi Gold** | 0% on everything | $6-8/month | Higher volume |

### Ko-fi Details

- **0% platform fee on one-time donations**
- Supporters pay via PayPal, Cards, Apple Pay, Google Pay, Venmo, CashApp
- Funds go directly to your PayPal/Stripe account (instant, not held)
- Simple embed button for your site
- No account required for donors

### Integration

```html
<!-- Simple Ko-fi Button -->
<script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
<script>
  kofiWidgetOverlay.draw('YOUR_USERNAME', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support Koppen',
    'floating-chat.donateButton.background-color': '#00b9fe'
  });
</script>
```

### Future Monetization Path

1. **MVP:** Ko-fi donation button (free, 0% fees)
2. **If volume grows:** Evaluate Ko-fi Gold ($6/month) for 0% on memberships
3. **Premium features:** Could use Ko-fi memberships or direct Stripe integration

### Sources

- [Ko-fi](https://ko-fi.com/)
- [Buy Me a Coffee Pricing - SchoolMaker](https://www.schoolmaker.com/blog/buy-me-a-coffee-pricing)
- [Ko-fi vs Buy Me a Coffee - Talks.co](https://talks.co/p/kofi-vs-buy-me-a-coffee/)
- [Virtual Tipjars - SaskMusic](https://www.saskmusic.org/how-to/articles/view,article/6992/virtual-tipjars-options)

---

## 5. Technical Architecture Summary

### Recommended MVP Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Data** | ECMWF ERA5 (pre-processed) | 0.25°, well-documented, free |
| **Classification** | Python (offline) | Compute Köppen types from 30-year normals |
| **Data Format** | GeoJSON / TopoJSON | Compact, web-native |
| **Backend** | Flask (or static hosting) | Simple, Python-native |
| **Mapping** | Leaflet.js (direct) | Lighter than Folium for browser |
| **Frontend** | Vanilla JS | No framework overhead |
| **Hosting** | Vercel / Netlify / GitHub Pages | Free static hosting |
| **Donations** | Ko-fi | 0% fee on tips |

### Data Pipeline

```
ECMWF ERA5 Monthly Data (NetCDF)
    ↓
Python script: Calculate 30-year means (1991-2020)
    ↓
Python script: Apply Köppen classification rules
    ↓
Export as GeoJSON (climate type per grid cell)
    ↓
Serve as static file or via simple API
    ↓
Leaflet.js renders in browser
```

### URL-as-Save-File Implementation

Custom classification rules can be encoded in URL:

```
https://koppen.app/?rules=eyJ0cm9waWNhbCI6MTgsImFyaWQiOjIwfQ==
```

Where the base64 decodes to:
```json
{"tropical": 18, "arid": 20, ...}
```

---

## Next Steps

1. **Download ERA5 sample data** - Test with 1991-2020 monthly means
2. **Implement classification algorithm** - Python script using Beck et al. rules
3. **Generate GeoJSON output** - One file with all climate types
4. **Build minimal Leaflet map** - Test rendering
5. **Add Ko-fi button** - Simple integration

---

## Sources Summary

### Climate Data
- [ERA5 Monthly - Google Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_MONTHLY)
- [ECMWF ERA5 Download Guide](https://confluence.ecmwf.int/display/CKB/How+to+download+ERA5)

### Köppen Classification
- [Beck et al. 2018 - Nature Scientific Data](https://www.nature.com/articles/sdata2018214)
- [NOAA JetStream Köppen Guide](https://www.noaa.gov/jetstream/global/climate-zones/jetstream-max-addition-k-ppen-geiger-climate-subdivisions)
- [Vienna University Köppen Maps](http://koeppen-geiger.vu-wien.ac.at/)

### Visualization
- [Folium Documentation](https://python-visualization.github.io/folium/latest/)
- [FastAPI](https://fastapi.tiangolo.com/)

### Monetization
- [Ko-fi](https://ko-fi.com/)
- [Ko-fi vs Buy Me a Coffee Comparison](https://talks.co/p/kofi-vs-buy-me-a-coffee/)
