# SmartKinneret

**An academic research prototype for ecological monitoring of Lake Kinneret.**

SmartKinneret is a React + Vite + TypeScript dashboard that explores a single
research question from real environmental sensor data:

> **How do meteorological and natural water conditions affect the risk of
> entering the water in Lake Kinneret?**

It ingests raw meteorological, wave, and current measurements, normalizes them,
applies a transparent rule-based risk model, runs a set of statistical tests,
and presents everything through eight interactive pages.

> ⚠️ **This system is an academic research prototype. Its risk classifications
> are not official swimming or emergency-safety instructions.**

---

## Table of contents

1. [Research question](#research-question)
2. [Data sources](#data-sources)
3. [Data-handling contract (assumptions & exclusions)](#data-handling-contract)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Commands](#commands)
7. [The preprocessing pipeline](#the-preprocessing-pipeline)
8. [The risk model](#the-risk-model)
9. [Statistical tests](#statistical-tests)
10. [Machine-learning model (optional)](#machine-learning-model-optional)
11. [The eight pages](#the-eight-pages)
12. [Limitations](#limitations)
13. [Ethics & safety](#ethics--safety)

---

## Research question

The app investigates whether and how natural conditions — wind speed, wave
height, water-current magnitude, and rainfall — relate to the risk of entering
the lake. "Risk" here is a **transparent, rule-based composite score**, not a
prediction of any official safety status. Every input, weight, and threshold is
visible to the user.

---

## Data sources

All data lives in `data_raw/` and was supplied for the project. Nothing in the
app is fabricated; when a variable has no data for a selection, the UI shows
**"No data available."**

### Meteorological stations (10-minute cadence), `data_raw/Meteo/`

| Station  | File                                              | Verified variables used                 | Notes |
|----------|---------------------------------------------------|------------------------------------------|-------|
| Bteha    | `Meto_Bteha2024.csv`                              | wind speed*, air temp, humidity, rain, wind dir | NA token `-` |
| Zemah    | `Meto_Zemah2024.csv`                              | wind speed*, air temp, humidity, rain, wind dir |       |
| Ginosar  | `Meto_Ginosar2024.xls` (+ `_converted.xlsx`)      | air temp, humidity, wind dir, solar      | **wind speed excluded** (failed sensor); no rain column |
| Ein Gev  | `Ein_Gev2022-2024.dat` (Campbell TOA5)            | humidity, wind speed, rain, wind dir     | **air temp excluded** (unverified unit); NA token `NAN` |

\* Wind speed at Bteha and Zemah is **assumed to be m/s** — see the data
contract below.

### Lake waves & currents, `data_raw/Lake_waves_currents/`

Deployments `02`–`06` are concatenated per station.

| Station            | Waves                         | Currents                       |
|--------------------|-------------------------------|--------------------------------|
| KNW (Golan Beach)  | `KNW02-06_Waves.xlsx` (hourly)| `KNW02-06_Currents.csv`        |
| KNC (Station F)    | —                             | `KNC02-06_Currents.csv`        |

Current files report velocity components, magnitude, and direction at multiple
depths. Wave files report `Hs`, `Tp`, peak/mean direction, and a sensor
`Depth(mm)` field (see contract).

---

## Data-handling contract

These rules were confirmed with the project owner and are enforced in
`scripts/preprocess.py`, surfaced on the **Data Quality** page, and listed in
the dataset manifest. **Questionable units are never silently assumed or
converted.**

**Documented assumptions**

1. **Bteha & Zemah wind speed → treated as m/s.** The source files do not state
   units; this is an explicit, documented assumption and the values are used.
2. **Wave timestamps converted from GMT → Israel local time** to align with the
   meteo/current series.
3. **Meteo & current timestamps assumed Israel local** (unlabeled in source).
4. **Current "magnitude" uses the shallowest (surface) depth as the default**;
   a depth-averaged value is also computed and available.
5. **Map marker positions are approximate** — for the stylized map only, not
   survey GPS.

**Excluded columns (kept visible, but never used in stats / risk / ML)**

- **`ginosar.WS_ms_Avg` (wind speed)** — the anemometer reads ≈ 0.000 m/s all
  year (failed sensor). Tagged *unit/quality unverified*. Ginosar's air
  temperature (≈ 24.8 °C median) and humidity **are** verified and used.
- **`eingev.AirTC_Avg` (air temperature)** — median ≈ 81.7, which is impossible
  as °C and **not confirmed** as °F by the file metadata. It is **not
  converted**, tagged *unit/quality unverified*, and excluded. Ein Gev's
  humidity, wind, and rain are used.

**Other rules**

- Both Ginosar and Ein Gev **remain in the system**; only their verified
  variables are used or displayed.
- **`Depth(mm)` is a sensor-measurement field, never Lake Kinneret water
  level.**
- Every assumption and exclusion appears on the **Data Quality** page and in
  this README.

---

## Project structure

```
smartkinneret/
├── data_raw/                     # Raw supplied data (read by the pipeline)
│   ├── Meteo/
│   └── Lake_waves_currents/
├── public/
│   ├── favicon.svg
│   └── data/processed/           # Normalized JSON (output of preprocessing)
│       ├── manifest.json
│       ├── stations.json
│       ├── timeseries.json
│       ├── alerts.json
│       ├── risk.json
│       ├── statistics.json
│       └── dataQuality.json
├── scripts/
│   ├── preprocess.py             # Authoritative pipeline (pandas/scipy/sklearn)
│   └── preprocess.mjs            # `npm run preprocess` entry point → runs the .py
├── src/
│   ├── config/                   # riskConfig, unitsConfig, stationConfig
│   ├── lib/                      # parsing, time alignment, loading, selection
│   ├── components/               # UI, charts, map, importer, etc.
│   ├── pages/                    # the 8 pages
│   ├── tests/                    # Vitest unit tests
│   ├── types/                    # shared TypeScript model
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Getting started

**Prerequisites**

- Node.js 18+ and npm
- Python 3 with `pandas numpy scipy scikit-learn openpyxl` *(only needed if you
  want to regenerate the processed data — see below)*

**Install**

```bash
npm install
```

The processed JSON in `public/data/processed/` is **already bundled**, so you can
run the app immediately without any Python step:

```bash
npm run dev
```

Then open the printed local URL.

### Uploading / replacing data

There are two ways to bring data in:

- **Batch (full rebuild):** drop replacement files into `data_raw/` keeping the
  same filenames, then run `npm run preprocess` to regenerate the processed JSON.
- **In-app preview:** the **Data Quality** page hosts an Importer that parses a
  CSV/TSV (PapaParse), XLSX/XLS (SheetJS), or Campbell `.dat`/TOA5 file in the
  browser, previews the first rows, and shows how columns map to the canonical
  schema. This demonstrates the JS parsing stack directly in the browser.

---

## Commands

| Command               | What it does                                              |
|-----------------------|-----------------------------------------------------------|
| `npm install`         | Install dependencies                                      |
| `npm run preprocess`  | Regenerate `public/data/processed/` from `data_raw/`      |
| `npm run dev`         | Start the Vite dev server                                 |
| `npm run build`       | Type-check (`tsc -b`) and build for production            |
| `npm run preview`     | Preview the production build                              |
| `npm test`            | Run the Vitest unit-test suite                            |

---

## The preprocessing pipeline

The **authoritative** pipeline is `scripts/preprocess.py`. It uses the
scientific Python stack — **pandas/numpy** for wrangling, **scipy** for the
statistical tests, and **scikit-learn** for the optional Random Forest — and it
is what produced the JSON shipped in `public/data/processed/`.

`npm run preprocess` runs `scripts/preprocess.mjs`, a small cross-platform Node
launcher that locates a Python 3 interpreter, invokes `preprocess.py` with the
project root as the working directory, streams its output, and exits with the
same status code. If Python or its packages are missing, it prints exact
installation guidance rather than failing silently. The pipeline is
deterministic: re-running it reproduces identical artifacts apart from the
`generatedAt` timestamp.

The pipeline:

1. Parses each raw source into a common `{timestamp, variable, value}` schema
   (TOA5 headers, NA tokens `-`/`NAN`, GMT→local wave times).
2. Applies the data-handling contract (assumptions documented, unverified
   columns flagged and excluded).
3. Aggregates to hourly/daily/monthly resolutions.
4. Computes the rule-based risk score and an alert series.
5. Runs the statistical tests and the optional ML model.
6. Writes seven normalized JSON files plus a `manifest.json`.

---

## The risk model

The risk model is intentionally **transparent and rule-based** — defined in
`src/config/riskConfig.ts` (mirrored in the pipeline). It combines four verified
drivers via a weighted score (0–100):

| Driver           | Weight |
|------------------|:------:|
| Wave height (Hs) |  35    |
| Wind speed       |  30    |
| Current magnitude|  20    |
| Rainfall         |  15    |

Each driver contributes points on a curve anchored to its own empirical
thresholds (50th and 85th percentiles): **0 points below the median**, ramping
to **half weight at the 85th percentile**, and up to **full weight above it**.
The summed score maps to a category:

- **Low** — score < 34
- **Moderate** — 34 ≤ score < 67
- **High** — score ≥ 67

A station with no verified contributing data is reported as **Insufficient
Data** rather than being assigned a misleading score. Risk model version
`1.0.0`.

---

## Statistical tests

Computed in the pipeline (scipy) and presented on **Reports & Statistics**, with
the significance level α stated alongside each result:

1. **Pearson correlation — wind speed vs. wave height (Hs).** Linear
   association between hourly wind and waves.
2. **Pearson correlation — wind speed vs. current magnitude.**
3. **Spearman rank correlation — wind speed vs. wave height.** A
   monotonic/robust counterpart to the Pearson test.
4. **One-way ANOVA — wind speed across stations** (with a Kruskal–Wallis
   non-parametric companion), testing whether mean wind differs by station.
5. **Chi-square test of independence — month vs. risk category**, testing
   whether the distribution of risk categories depends on the month.
6. **Linear regression — Hs on wind speed**, with slope, intercept, and R².

A descriptive-statistics table (count, mean, std, min/median/max) accompanies
the eight verified variables, along with a correlation heatmap. Exact figures
are written into `statistics.json` by the pipeline so the page always reflects
the current data.

---

## Machine-learning model (optional)

An optional **Random Forest regressor** (200 trees, scikit-learn) predicts
significant wave height `Hs` from wind speed, wind-direction components
(`sin`/`cos`), humidity, hour, and month. It is a supplementary, exploratory
component — the rule-based model remains the system's transparent core. The
Reports page shows feature importances and an actual-vs-predicted view. Reported
test-set performance: **R² ≈ 0.69, MAE ≈ 0.06 m**.

---

## The eight pages

1. **Dashboard** — headline metrics, an observed-conditions chart with
   station/variable/resolution filters, the current risk gauge, and a sensor
   grid.
2. **Sensor Network** — per-station detail: risk gauge, driver contributions,
   latest verified values, and any unverified/assumption notes.
3. **Lake Map** — a stylized map of station positions (approximate) with a
   detail panel.
4. **Alerts** — filterable, paginated list of derived moderate/high-risk events.
5. **Forecast** — a monthly climatology built from the daily series, clearly
   labeled **"Experimental Statistical Estimate — Not an Official Forecast"**
   (no randomness; purely historical aggregation).
6. **Reports & Statistics** — descriptive table, correlation heatmap, all
   statistical tests, the ML section, and CSV/JSON export + print.
7. **Public Information** — plain-language status and a full explanation of the
   risk model. Emergency-contact fields are clearly marked as **placeholders /
   unverified**.
8. **Data Quality** — the heart of the transparency story: files parsed,
   unverified columns, assumptions, unconfirmed units, excluded columns, parse
   errors, a downloadable report, and the in-app Importer.

All timestamps reflect the **Latest Available Observation** in the dataset, not
real-time data.

---

## Limitations

- The dataset is historical; the app describes **Latest Available Observation**,
  not live conditions.
- Several units are **unlabeled in the source** and treated as documented
  assumptions (notably Bteha/Zemah wind speed as m/s).
- Two columns are **excluded** for quality/units reasons (Ginosar wind, Ein Gev
  air temperature).
- The risk model is a **transparent heuristic**, not a validated safety
  instrument, and its thresholds are empirical percentiles of this dataset.
- Map coordinates are **approximate**.
- The ML model is **exploratory** and trained on a limited record.

---

## Ethics & safety

> **This system is an academic research prototype. Its risk classifications are
> not official swimming or emergency-safety instructions.**

The project prioritizes honesty about data quality over completeness: unverified
data is flagged and excluded rather than guessed at, assumptions are documented
everywhere they matter, and nothing is fabricated. For any decision about
entering the water, rely on official local authorities and posted safety
guidance — not this prototype.
