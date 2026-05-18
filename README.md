# Structural Subsampling Engine

**`structpts-subsample`** | Version 1.0.0 | MIT License

```python
import structpts_subsample
```

A Python library implementing seven spatial subsampling algorithms for structural orientation data (bedding, foliation) used in 3D geological modelling workflows. The engine reduces spatial clustering while preserving the statistical character of orientations, supporting workflows from rapid exploratory decimation through to geologically-informed first-order subsampling.

---

## Overview

Raw structural datasets collected from geological maps or field campaigns often exhibit dense spatial clustering that introduces bias into implicit 3D geological models. This library provides a systematic, reproducible pipeline for reducing that clustering across seven complementary methods, each suited to different dataset characteristics and modelling objectives.

The pipeline operates in two stages:

- **Stage 0** — Column standardisation and bedding filter: normalises column names, converts strike to dip-direction where needed, filters to bedding-only records, and drops null rows.
- **Stage 1** — Subsampling: applies one or more of the seven algorithms to the standardised dataset.

All tolerance parameters accept either a single value or a list of values; when a list is provided, every combination is run automatically and saved with parameter-encoded filenames.

---

## Algorithms

| # | Name | Description |
|---|------|-------------|
| 1 | `decimation` | Retain every nth point by digitisation order |
| 2 | `stochastic` | Random-fraction sampling with configurable seed |
| 3 | `gridcell_average` | Grid-cell mean-vector averaging |
| 4 | `spherical_kent` | Grid-cell Kent distribution statistics (κ, β) |
| 5 | `outlier_removal` | Single max-Δκ outlier removal per cell |
| 5b | `outlier_carmichael` | Iterative Δκ-break algorithm (Carmichael & Ailleres 2016) |
| 6 | `firstorder` | Proximity + angular alignment to geological contacts |

---

## Installation

### Dependencies

```bash
pip install geopandas pandas numpy shapely
```

Or using the provided requirements file:

```bash
pip install -r requirements.txt
```

### Python version

Tested on Python 3.10. Compatible with Python 3.8+.

---

## Quick Start

### Full pipeline from a raw shapefile

```python
from structpts_subsample import subsample_structures_file

results = subsample_structures_file(
    input_file        = 'inputs/bedding.shp',
    output_dir        = 'outputs/',
    geology_file      = 'inputs/geology.shp',
    dip_input_col     = 'DIP',
    dipdir_input_col  = 'DIP_DIR',
    dipdir_input_type = 'dip_direction',
    methods           = 'all',
    grid_n            = 1000,
    verbose           = True,
)
print(results)
```

### Run selected methods at multiple resolutions

```python
results = subsample_structures_file(
    input_file        = 'inputs/bedding.shp',
    output_dir        = 'outputs/',
    geology_file      = 'inputs/geology.shp',
    dip_input_col     = 'DIP',
    dipdir_input_col  = 'STRIKE',
    dipdir_input_type = 'strike',
    filter_col        = 'FEATURE',
    filter_val        = 'Bedding, showing strike and dip',
    methods           = ['gridcell_average', 'spherical_kent',
                         'outlier_removal', 'firstorder'],
    grid_n            = [500, 1000, 2000],
    dist_buffer       = [250, 500, 1000],
    angle_tol         = [10, 15, 20],
)
```

### Use the engine class directly

```python
import geopandas as gpd
from structpts_subsample import SubsamplingEngine, save_grid_to_shapefile

gdf    = gpd.read_file('input_beddings_only/bedding.shp')
engine = SubsamplingEngine()
bounds = gdf.total_bounds
minx, maxx = int(bounds[0]), int(bounds[2]) + 1
miny, maxy = int(bounds[1]), int(bounds[3]) + 1

# Decimation
result = engine.decimation(gdf, n=5, path_out='outputs/')

# Spherical statistics
fname  = engine.spherical_kent(gdf, minx, maxx, miny, maxy, n=1000, path_out='outputs/')
result = save_grid_to_shapefile('outputs/', fname)
print(result[['DIP', 'DIP_DIR', 'kappa', 'beta']].describe())
```

---

## Input Requirements

The raw input shapefile can have any column naming convention and may contain mixed feature types (bedding, foliation, joints). Stage 0 handles standardisation automatically. You must supply:

| Parameter | Description |
|-----------|-------------|
| `dip_input_col` | Column name for dip angle (degrees) |
| `dipdir_input_col` | Column name for dip direction **or** strike (degrees) |
| `dipdir_input_type` | `'dip_direction'` or `'strike'` |
| `filter_col` / `filter_val` | Optional attribute filter to select bedding records only |

The shapefile must be in a projected coordinate system (metres). Geographic coordinate systems (degrees) are not supported for grid-cell or distance-based methods.

---

## Output Files

Each method writes output to the specified `output_dir`. Filenames encode the method and tolerance parameter:

| Method | Output filename pattern |
|--------|------------------------|
| Decimation | `structure_file_decimation_{n}.shp/.csv` |
| Stochastic | `structure_file_stochastic_{frac}.shp/.csv` |
| Grid-cell average | `structure_file_gridcell_{n}.shp/.csv` |
| Spherical Kent | `structure_file_spherical_{n}.shp/.csv` |
| Outlier removal | `structure_file_outlier_{n}.shp/.csv` |
| Outlier Carmichael | `structure_file_outlier_carmichael_{n}.shp/.csv` |
| First-order | `structure_file_firstorder_d{dist}_a{angle}.shp/.csv` |

Grid-cell methods write an additional `count`, `kappa`, and `beta` column in the CSV. Outlier methods also write the index of the removed measurement (`REMOVED_INDEX`) or the number removed (`n_removed`).

---

## Key Design Decisions

### Kent distribution corrections

Two known transcription errors in the published Kent distribution estimation algorithm (Leong & Carlile 1998; Carmichael & Ailleres 2016) are corrected in this implementation:

1. **H-matrix** — position [2,1] must be `sin(θ)·sin(φ)`, not `sin(θ)·cos(φ)`.
2. **Sword angle** — the denominator must be `B[0,0] − B[1,1]` (diagonal difference), not `B[0,1] − B[1,1]`.

### Reproducibility

The stochastic method uses a fixed random seed (`random_state=42`) by default, ensuring reproducible results across runs. Pass `stoch_random_state=None` to draw a fresh random sample each time.

### Outlier removal threshold

Grid cells containing 3 or fewer measurements are excluded from the output of the outlier removal methods, as insufficient data remain for reliable Kent distribution estimation.

---

## Command-Line Execution

The module can be run directly to process the two configured example datasets (Flinders Range and Ninghan Syncline):

```bash
python structpts_subsample.py
```

Edit the `DATASETS` dictionary at the bottom of the file to point to your own input files.

---

## Repository Structure

```
structpts-subsample/
├── structpts_subsample.py       # Main library
├── README.md
├── LICENSE
├── CITATION.cff
├── requirements.txt
├── inputs/                      # Sample input datasets
│   ├── sth_flinders_bedding_shapefile.*   # Bedding (GSSA — southern Flinders Ranges)
│   ├── 2M_Surface_Geology_M2LFIX.*        # Surface geology (GSSA — Flinders Ranges)
│   ├── warox_planar_Clip.*                # Bedding (GSWA — Ninghan Syncline)
│   └── 500KClipped4_M2LFIX.*             # Surface geology (GSWA — Ninghan Syncline)
├── outputs/                     # Pre-computed example outputs (all 7 methods)
│   ├── flinders/                # Results for southern Flinders Ranges dataset
│   └── ninghan/                 # Results for Ninghan Syncline dataset
├── examples/
│   ├── example_basic.py         # All methods, user-supplied data
│   ├── example_parameter_sweep.py   # Grid-cell sweep — Flinders Ranges
│   └── example_firstorder.py    # First-order sweep — Ninghan Syncline
└── docs/
    └── structural_subsampling_manual_v1.docx
```

The `inputs/` and `outputs/` folders use data sourced from GSSA (SARIG) and GSWA open geoscience data portals (see References). The example scripts reference these datasets directly — run them from anywhere, paths resolve automatically.

---

## Examples

See the `examples/` directory for standalone example scripts:

- `example_basic.py` — template for user-supplied data; runs all seven methods at default tolerances
- `example_parameter_sweep.py` — grid-cell method sweep across 11 resolutions using the supplied Flinders Ranges dataset
- `example_firstorder.py` — first-order subsampling across a 9 × 6 Cartesian product of tolerances using the supplied Ninghan Syncline dataset

---

## Citation

If you use this software in your research, please cite it as:

```
Joshi, R. (2026). Structural Subsampling Engine: Orientation Data Spatial Reduction
for 3D Geological Modelling (Version 1.0.0). Zenodo.
https://doi.org/[YOUR-DOI-HERE]
```

A `CITATION.cff` file is provided for automated citation tools (GitHub, Zotero, etc.).

---

## References

- Carmichael, T. & Ailleres, L. (2016). Method and analysis for the upscaling of structural data. *Journal of Structural Geology*, 83, 121–133. https://doi.org/10.1016/j.jsg.2015.09.003
- Geological Survey of South Australia (GSSA). Bedding orientation and surface geology datasets for the southern Flinders Ranges. *SARIG — South Australia's Resource Information Gateway*, Department for Energy and Mining, Government of South Australia. https://map.sarig.sa.gov.au/
- Geological Survey of Western Australia (GSWA). Structural geology and 1:500 000 interpreted bedrock geology data for the Ninghan Syncline, Murchison region. *GSWA Open File Geoscience Data*, Department of Mines, Industry Regulation and Safety, Government of Western Australia. https://dasc.dmirs.wa.gov.au/
- Kent, J.T. (1982). The Fisher-Bingham distribution on the sphere. *Journal of the Royal Statistical Society Series B*, 44(1), 71–80.
- Leong, L.S. & Carlile, J.C. (1998). A method for estimating the Kent distribution parameters for orientation data. *Mathematical Geology*.
- Putz, M., Klötzli, U., Siebel, W., & Schmid, R. (2006). Application of the Monte Carlo method in geochronology. *Contributions to Mineralogy and Petrology*, 152(4), 501–514.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
