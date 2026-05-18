"""
Example 1 — Basic usage: single dataset, all methods at default tolerances
==========================================================================

Demonstrates the simplest way to run the full subsampling pipeline on a
single bedding shapefile.  Stage 0 (column standardisation) and Stage 1
(subsampling) are both handled by the single ``subsample_structures_file``
call.

Input assumed:
    inputs/bedding.shp      - raw bedding point shapefile (replace with your own data)
    inputs/geology.shp      - geology polygon shapefile (replace with your own data)

Column layout assumed:
    DIP column    : 'DIP'       (already the standard name)
    DIP_DIR column: 'DIP_DIR'   (already the standard name, in dip-direction convention)
    No feature-type filter needed (file contains bedding only)

Note: Update INPUT_BEDDING, INPUT_GEOLOGY, and the column parameters below to
match your own shapefile.  See examples 2 and 3 for ready-to-run examples
using the supplied sample datasets.
"""

import os
import sys
from pathlib import Path

# ── Package root (one level above this examples/ directory) ──────────────────
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from structpts_subsample import subsample_structures_file

# ── Paths — update these to point to your own data ───────────────────────────
INPUT_BEDDING = str(_ROOT / 'inputs' / 'bedding.shp')
INPUT_GEOLOGY = str(_ROOT / 'inputs' / 'geology.shp')
OUTPUT_DIR    = str(_ROOT / 'outputs' / 'basic') + os.sep

# ── Run all seven methods at default tolerances ───────────────────────────────
results = subsample_structures_file(
    input_file        = INPUT_BEDDING,
    output_dir        = OUTPUT_DIR,
    geology_file      = INPUT_GEOLOGY,
    dip_input_col     = 'DIP',
    dipdir_input_col  = 'DIP_DIR',
    dipdir_input_type = 'dip_direction',   # column already holds dip-direction azimuth
    filter_col        = None,              # no feature filter needed
    filter_val        = None,
    methods           = 'all',
    grid_n            = 1000,              # 1 km grid cells
    decimation_n      = 5,                 # retain every 5th point
    stoch_frac        = 0.5,               # retain 50% randomly
    stoch_random_state = 42,              # fixed seed for reproducibility
    dist_buffer       = 500,              # 500 m proximity buffer (first-order)
    angle_tol         = 15,               # 15-degree strike tolerance (first-order)
    verbose           = True,
)

# ── Print summary ─────────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("  Results summary")
print("=" * 50)
for method, count in results.items():
    print(f"  {method:<40} {count}")
