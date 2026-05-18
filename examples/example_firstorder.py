"""
Example 3 — First-order subsampling: Cartesian product of tolerance parameters
==============================================================================

Demonstrates the first-order subsampling method, which retains bedding
measurements based on:
  (a) proximity to geological contacts (distance buffer), and
  (b) angular alignment with the contact strike (angle tolerance).

Passing lists for both dist_buffer and angle_tol generates the full Cartesian
product of combinations.  For example, 3 distances x 3 angles = 9 output files.

This example also shows how to handle a raw shapefile where the orientation
data are recorded as strike rather than dip-direction, and where the file
contains mixed feature types that must be filtered to bedding only.
"""

import os
import sys
from pathlib import Path

# ── Package root (one level above this examples/ directory) ──────────────────
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from structpts_subsample import subsample_structures_file

# ── Paths (resolved relative to the package root) ────────────────────────────
INPUT_BEDDING = str(_ROOT / 'inputs' / 'warox_planar_Clip.shp')
INPUT_GEOLOGY = str(_ROOT / 'inputs' / '500KClipped4_M2LFIX.shp')
OUTPUT_DIR    = str(_ROOT / 'outputs' / 'firstorder') + os.sep

# ── Tolerance parameter grids ─────────────────────────────────────────────────
#   All 3 x 6 = 18 combinations will be run and saved.
DIST_BUFFERS = [100, 250, 500, 750, 1000, 2000, 3000, 4000, 5000]   # metres
ANGLE_TOLS   = [5, 10, 15, 20, 25, 30]                               # degrees

# ── Run first-order subsampling across all combinations ───────────────────────
results = subsample_structures_file(
    input_file        = INPUT_BEDDING,
    output_dir        = OUTPUT_DIR,
    geology_file      = INPUT_GEOLOGY,
    dip_input_col     = 'DIP',
    dipdir_input_col  = 'STRIKE',              # source records strike, not dip-direction
    dipdir_input_type = 'strike',              # triggers (strike + 90) % 360 conversion
    filter_col        = 'FEATURE',             # filter to bedding-only records
    filter_val        = 'Bedding, showing strike and dip',
    methods           = ['firstorder'],
    dist_buffer       = DIST_BUFFERS,          # list — Cartesian product with angle_tol
    angle_tol         = ANGLE_TOLS,
    verbose           = True,
)

# ── Print summary table ───────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  First-order subsampling results")
print("=" * 70)

# Re-format as a distance x angle matrix for readability
import pandas as pd
rows = []
for key, count in results.items():
    if not key.startswith('firstorder_d'):
        continue
    parts = key.replace('firstorder_', '').split('_')
    dist  = int(parts[0][1:])
    angle = int(parts[1][1:])
    rows.append({'Distance (m)': dist, 'Angle (deg)': angle, 'Retained': count})

if rows:
    df = pd.DataFrame(rows)
    pivot = df.pivot(index='Distance (m)', columns='Angle (deg)', values='Retained')
    print("\n  Retained measurements (rows = distance buffer, cols = angle tolerance):\n")
    print(pivot.to_string())

print(f"\nOutputs written to: {OUTPUT_DIR}")
