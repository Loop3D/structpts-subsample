"""
Example 2 — Parameter sweep: grid-cell methods across multiple resolutions
==========================================================================

Demonstrates running grid-cell averaging, spherical statistics, and outlier
removal across a range of cell sizes in a single call.  All results are saved
independently with parameter-encoded filenames.

Suitable for: identifying the optimal grid cell size for a given dataset by
comparing model outputs across resolutions.

This example also shows how to handle a raw shapefile where:
  - The dip column has a non-standard name ('INCLINATIO')
  - The dip direction uses a non-standard name ('AZIMUTH_TR')
  - The input is already bedding-only (no feature filter required)
"""

import os
import sys
from pathlib import Path

# ── Package root (one level above this examples/ directory) ──────────────────
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from structpts_subsample import subsample_structures_file

# ── Paths (resolved relative to the package root) ────────────────────────────
INPUT_BEDDING = str(_ROOT / 'inputs' / 'sth_flinders_bedding_shapefile.shp')
INPUT_GEOLOGY = str(_ROOT / 'inputs' / '2M_Surface_Geology_M2LFIX.shp')
OUTPUT_DIR    = str(_ROOT / 'outputs' / 'sweep') + os.sep

# ── Grid cell sizes to sweep (metres) ────────────────────────────────────────
GRID_SIZES = [100, 250, 500, 750, 1000, 2000, 3000, 4000, 5000, 10000, 20000]

# ── Run grid-cell methods at every resolution ─────────────────────────────────
#
# Passing a list to grid_n causes each method to be run len(GRID_SIZES) times,
# producing one output file per combination.
#
results = subsample_structures_file(
    input_file        = INPUT_BEDDING,
    output_dir        = OUTPUT_DIR,
    geology_file      = INPUT_GEOLOGY,
    dip_input_col     = 'INCLINATIO',         # non-standard source column
    dipdir_input_col  = 'AZIMUTH_TR',         # non-standard source column
    dipdir_input_type = 'dip_direction',       # already an azimuth, not strike
    filter_col        = None,                  # source is bedding-only
    filter_val        = None,
    methods           = ['gridcell_average',   # Methods 3, 4, 5
                         'spherical_kent',
                         'outlier_removal'],
    grid_n            = GRID_SIZES,            # list triggers the full sweep
    verbose           = True,
)

# ── Print summary table ───────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Parameter sweep results")
print("=" * 60)
print(f"  {'Method / Tolerance':<45} {'Count':>10}")
print("-" * 60)
for method, count in results.items():
    val = f"{count:,}" if isinstance(count, int) else str(count)
    print(f"  {method:<45} {val:>10}")

print(f"\nOutputs written to: {OUTPUT_DIR}")
print(f"Total files: {len([k for k, v in results.items() if isinstance(v, int) and v > 0])}")
