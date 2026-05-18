"use strict";
const path  = require("path");
const fs    = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, HeadingLevel, SectionType
} = require(path.join(__dirname, "node_modules/docx"));

// ── Palette ───────────────────────────────────────────────────────────────────
const DARK_BLUE  = "1F3864";
const MED_BLUE   = "2E75B6";
const LIGHT_BLUE = "EBF3FB";
const ALT_ROW    = "F0F5FB";
const CODE_BG    = "F4F4F4";
const PAGE_W     = 12240;  // US Letter
const PAGE_H     = 15840;
const MARGIN     = 1440;
const CONTENT_W  = PAGE_W - 2 * MARGIN;  // 9360

// ── Cell borders ──────────────────────────────────────────────────────────────
const cb   = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bord = { top: cb, bottom: cb, left: cb, right: cb };

// ── Helpers ───────────────────────────────────────────────────────────────────

function sp(before, after) {
  return { spacing: { before, after } };
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { after: 140 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "000000" })],
    ...opts,
  });
}

function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { after: 140 },
    children: runs,
    ...opts,
  });
}

function boldRun(text)   { return new TextRun({ text, font: "Arial", size: 22, bold: true }); }
function normalRun(text) { return new TextRun({ text, font: "Arial", size: 22 }); }

function note(text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { after: 140 },
    shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE },
    indent: { left: 360, right: 360 },
    children: [
      new TextRun({ text: "Note: ", font: "Arial", size: 22, bold: true, color: DARK_BLUE }),
      new TextRun({ text, font: "Arial", size: 22, color: "000000" }),
    ],
  });
}

// Code block: array of lines → array of paragraphs
function codeBlock(lines) {
  return lines.map((line, i) => {
    const isFirst = i === 0;
    const isLast  = i === lines.length - 1;
    return new Paragraph({
      spacing: {
        before: isFirst ? 100 : 0,
        after:  isLast  ? 100 : 0,
        line: 240, lineRule: "exact",
      },
      shading: { type: ShadingType.CLEAR, fill: CODE_BG },
      indent: { left: 360, right: 360 },
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "333333" })],
    });
  });
}

// Header cell
function hCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
    borders: bord,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, bold: true, color: "FFFFFF" })],
    })],
  });
}

// Data cell
function dCell(text, width, fill = "FFFFFF", bold = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    borders: bord,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, color: "222222", bold })],
    })],
  });
}

function blankRow() {
  return new Paragraph({ spacing: { before: 0, after: 140 }, children: [] });
}

// ── Heading factories ─────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: DARK_BLUE })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: MED_BLUE })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: MED_BLUE })],
  });
}

// ── Divider line ──────────────────────────────────────────────────────────────
function divider() {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MED_BLUE, space: 1 } },
    children: [],
  });
}

// ── Footer ────────────────────────────────────────────────────────────────────
const pageFooter = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Structural Subsampling Engine — User Manual v1.0.0    |    Page ", font: "Arial", size: 18, color: "888888" }),
        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "888888" }),
      ],
    }),
  ],
});

// =============================================================================
// TITLE PAGE
// =============================================================================
const titleSection = {
  properties: {
    type: SectionType.NEXT_PAGE,
    page: {
      size: { width: PAGE_W, height: PAGE_H },
      margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
    },
  },
  children: [
    new Paragraph({ spacing: { before: 0, after: 1440 }, children: [] }),  // top spacer ~1 inch
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Structural Subsampling Engine", font: "Arial", size: 56, bold: true, color: DARK_BLUE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: "User Manual for Spatial Reduction of Structural Orientation Data", font: "Arial", size: 28, color: MED_BLUE, italics: true })],
    }),
    divider(),
    new Paragraph({ spacing: { before: 0, after: 480 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Version 1.0.0", font: "Arial", size: 24, bold: true, color: "333333" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "May 2026", font: "Arial", size: 24, color: "555555" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: "Released under the MIT License", font: "Arial", size: 22, color: "777777" })],
    }),
    divider(),
    new Paragraph({ spacing: { before: 0, after: 240 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "R. Joshi", font: "Arial", size: 22, color: "333333" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "raneejoshi@gmail.com", font: "Arial", size: 22, color: MED_BLUE })],
    }),
  ],
};

// =============================================================================
// MAIN CONTENT
// =============================================================================

// ── Section 1: Introduction ───────────────────────────────────────────────────
const sec1 = [
  h1("1  Introduction"),
  body(
    "Raw structural datasets collected from geological maps or field campaigns often exhibit dense spatial clustering, particularly along mapped contacts or in well-sampled outcrops. This spatial bias can propagate into implicit 3D geological models, introducing geometric artefacts and inflating the apparent importance of densely sampled regions. The Structural Subsampling Engine provides a systematic, reproducible pipeline for reducing spatial clustering in bedding and foliation point datasets while preserving the statistical character of the orientations."
  ),
  body(
    "The software implements seven complementary subsampling algorithms, ranging from simple systematic decimation to statistically rigorous spherical-statistics-based methods and a geologically-informed first-order subsampling technique. Each algorithm is suited to different dataset characteristics and modelling objectives. This manual describes the installation requirements, input data format, each algorithm in detail, and provides worked usage examples."
  ),
  body(
    "All outputs are written as ESRI Shapefiles and CSV files with parameter-encoded filenames, enabling systematic comparison of results across tolerance values without manual file management. Tolerance parameters accept either a single value or a Python list; when a list is supplied, the engine runs every value automatically and saves each result independently."
  ),
];

// ── Section 2: System Requirements ───────────────────────────────────────────
const depsTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [2800, 1800, 4760],
  rows: [
    new TableRow({ children: [hCell("Package", 2800), hCell("Minimum Version", 1800), hCell("Purpose", 4760)] }),
    new TableRow({ children: [dCell("geopandas", 2800, "FFFFFF"), dCell("0.10.0", 1800, "FFFFFF"), dCell("Geospatial data I/O, spatial joins, CRS management", 4760, "FFFFFF")] }),
    new TableRow({ children: [dCell("pandas", 2800, ALT_ROW), dCell("1.3.0", 1800, ALT_ROW), dCell("DataFrame manipulation and CSV I/O", 4760, ALT_ROW)] }),
    new TableRow({ children: [dCell("numpy", 2800, "FFFFFF"), dCell("1.21.0", 1800, "FFFFFF"), dCell("Vectorised numerical computation", 4760, "FFFFFF")] }),
    new TableRow({ children: [dCell("shapely", 2800, ALT_ROW), dCell("1.8.0", 1800, ALT_ROW), dCell("Geometric operations and spatial predicates", 4760, ALT_ROW)] }),
  ],
});

const sec2 = [
  h1("2  System Requirements and Installation"),
  h2("2.1  Python Dependencies"),
  body("The following Python packages are required. Install using pip:"),
  ...codeBlock(["pip install geopandas pandas numpy shapely"]),
  body("Or using the provided requirements file:"),
  ...codeBlock(["pip install -r requirements.txt"]),
  blankRow(),
  depsTable,
  blankRow(),
  h2("2.2  Python Version"),
  body("Python 3.8 or higher is required. The software has been tested on Python 3.10 (CPython). No C extensions are compiled during installation; all dependencies are available via pip on Windows, macOS, and Linux."),
  h2("2.3  Coordinate Reference System"),
  body("All input shapefiles must be in a projected coordinate reference system (CRS) with units of metres. Geographic coordinate systems with angular units (degrees) are not supported for grid-cell or distance-based methods, as these methods rely on Euclidean distance calculations. Common projected CRS examples include GDA2020 / MGA zones (EPSG:7854–7864) and UTM zones (EPSG:326xx / EPSG:327xx)."),
];

// ── Section 3: Pipeline Overview ──────────────────────────────────────────────
const sec3 = [
  h1("3  Pipeline Overview"),
  body("The engine operates in two sequential stages:"),
  bodyRuns([
    boldRun("Stage 0 — Column Standardisation and Bedding Filter. "),
    normalRun("Normalises column names to the four standard names used by all methods (DIP, DIP_DIR, EASTING, NORTHING), optionally filters the input to bedding-only records using a user-specified attribute value, converts strike to dip-direction where required using the right-hand rule (dip_direction = strike + 90), and drops rows with null values in any of the four key columns. The standardised shapefile is written to the input_beddings_only/ directory."),
  ]),
  bodyRuns([
    boldRun("Stage 1 — Subsampling. "),
    normalRun("Applies one or more of the seven subsampling algorithms to the standardised dataset. Methods are selected by name via the methods parameter and can be run in any combination. Tolerance parameters accept single values or lists; when lists are provided every combination is run automatically."),
  ]),
  body("The recommended entry point is subsample_structures_file(), which accepts a raw input shapefile (any column names, any feature mix) and handles both stages in a single call. Use subsample_file() if Stage 0 has already been run and the standardised shapefile is available directly."),
  note("All standard column names throughout the pipeline: DIP (dip angle, degrees), DIP_DIR (dip direction, degrees 0–360 clockwise from north), EASTING (projected easting, metres), NORTHING (projected northing, metres)."),
];

// ── Section 4: Input File Requirements ────────────────────────────────────────
const inputTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [2600, 1600, 5160],
  rows: [
    new TableRow({ children: [hCell("Parameter", 2600), hCell("Type", 1600), hCell("Description", 5160)] }),
    new TableRow({ children: [dCell("input_file", 2600, "FFFFFF", true), dCell("str", 1600, "FFFFFF"), dCell("Path to the raw bedding point shapefile", 5160, "FFFFFF")] }),
    new TableRow({ children: [dCell("dip_input_col", 2600, ALT_ROW, true), dCell("str", 1600, ALT_ROW), dCell("Column name for dip angle (degrees, 0 = horizontal, 90 = vertical)", 5160, ALT_ROW)] }),
    new TableRow({ children: [dCell("dipdir_input_col", 2600, "FFFFFF", true), dCell("str", 1600, "FFFFFF"), dCell("Column name for dip direction or strike (degrees)", 5160, "FFFFFF")] }),
    new TableRow({ children: [dCell("dipdir_input_type", 2600, ALT_ROW, true), dCell("str", 1600, ALT_ROW), dCell("'dip_direction' or 'strike' — controls conversion in Stage 0", 5160, ALT_ROW)] }),
    new TableRow({ children: [dCell("filter_col", 2600, "FFFFFF", true), dCell("str | None", 1600, "FFFFFF"), dCell("Attribute column for bedding filter (e.g. 'FEATURE'). None = no filter", 5160, "FFFFFF")] }),
    new TableRow({ children: [dCell("filter_val", 2600, ALT_ROW, true), dCell("str | None", 1600, ALT_ROW), dCell("Attribute value to retain (e.g. 'Bedding, showing strike and dip')", 5160, ALT_ROW)] }),
    new TableRow({ children: [dCell("geology_file", 2600, "FFFFFF", true), dCell("str", 1600, "FFFFFF"), dCell("Geology polygon shapefile — required for first-order method only", 5160, "FFFFFF")] }),
  ],
});

const sec4 = [
  h1("4  Input File Requirements"),
  body("The raw input shapefile may have any column naming convention and may contain mixed feature types (bedding, foliation, joints). Stage 0 handles all normalisation automatically. The following configuration parameters must be supplied to the pipeline entry functions:"),
  blankRow(),
  inputTable,
  blankRow(),
  note("When dipdir_input_type = 'strike', the dip direction is computed as (strike + 90) % 360, following the right-hand rule convention: a strike of 0° (north) produces a dip direction of 90° (east)."),
];

// ── Section 5: Methods ────────────────────────────────────────────────────────
const sec5 = [
  h1("5  Subsampling Methods"),

  // 5.1 Decimation
  h2("5.1  Method 1 — Decimation"),
  body("Retains every nth point from the dataset in its digitisation order by slicing the DataFrame with a fixed step (iloc[::n]). This is the simplest data reduction technique and is most appropriate for datasets characterised by a single dominant structural trend with dense, uniform sampling where the spatial ordering of measurements is relatively consistent."),
  bodyRuns([boldRun("Key parameter: "), normalRun("decimation_n (integer, default: 5) — retains records at indices 0, n, 2n, 3n, etc.")]),
  bodyRuns([boldRun("Output: "), new TextRun({ text: "structure_file_decimation_{n}.shp  /  .csv", font: "Courier New", size: 20 })]),
  bodyRuns([boldRun("Limitation: "), normalRun("Sensitive to digitisation order; cannot account for the spatial distribution or geological importance of individual measurements. Not suitable for datasets with irregular digitisation sequences.")]),

  // 5.2 Stochastic
  h2("5.2  Method 2 — Stochastic Subsampling"),
  body("Randomly samples a specified fraction of the input dataset using pandas DataFrame.sample(). A fixed random seed (default: 42) ensures reproducibility across runs. Passing stoch_random_state=None draws a fresh random sample each time, producing non-reproducible results."),
  bodyRuns([boldRun("Key parameters: "), normalRun("stoch_frac (float 0–1, default: 0.5) — fraction to retain; stoch_random_state (int or None, default: 42) — random seed.")]),
  bodyRuns([boldRun("Output: "), new TextRun({ text: "structure_file_stochastic_{frac}.shp  /  .csv", font: "Courier New", size: 20 })]),
  bodyRuns([boldRun("Limitation: "), normalRun("Spatial distribution of structural features is not considered. Results are reproducible only when a fixed seed is specified.")]),

  // 5.3 Grid-cell averaging
  h2("5.3  Method 3 — Grid-Cell Averaging"),
  body("Divides the study area into a regular grid of n × n metre cells. All measurements within each cell are combined into a single representative orientation using the normalised 3D vector mean (direction cosines). Each representative measurement is positioned at the geometric centre of its grid cell. Empty cells are omitted from the output."),
  body("The mean orientation is computed as the normalised sum of the individual unit vectors (direction cosines l, m, n derived from dip and dip-direction), converted back to dip/dip-direction using dircos2ddd(). This approach treats orientation data as unit vectors in 3D space but does not account for the statistical distribution of orientations within each cell."),
  bodyRuns([boldRun("Key parameter: "), normalRun("grid_n (integer, metres, default: 1000).")]),
  bodyRuns([boldRun("Output columns: "), new TextRun({ text: "EASTING, NORTHING, DIP, DIP_DIR", font: "Courier New", size: 20 })]),
  bodyRuns([boldRun("Limitation: "), normalRun("Does not account for the statistical distribution of orientations within each cell; sensitive to grid size selection. Can produce misleading averages when a single cell straddles a major structural boundary.")]),

  // 5.4 Spherical statistics
  h2("5.4  Method 4 — Spherical Statistics (Kent Distribution)"),
  body("Applies the same spatial grid as Method 3 but uses the Kent (5-parameter Fisher–Bingham) distribution to characterise orientations within each cell. In addition to the mean orientation, the method estimates two distribution parameters:"),
  bodyRuns([boldRun("kappa (κ): "), normalRun("concentration parameter — higher values indicate tighter clustering of orientations around the mean.")]),
  bodyRuns([boldRun("beta (β): "), normalRun("ovalness parameter — zero indicates rotational symmetry; non-zero values indicate an elongated distribution on the sphere.")]),
  body("The Kent distribution is particularly appropriate for structural geology because kappa can be estimated even when orientation data are not rotationally symmetric, which is typical for natural geological structures. The implementation corrects two known transcription errors present in both Leong & Carlile (1998) and Carmichael & Ailleres (2016): (i) H-matrix position [2,1] must be sin(θ)sin(ϕ), not sin(θ)cos(ϕ); (ii) the sword-angle denominator must be B[0,0]−B[1,1] (diagonal difference), not B[0,1]−B[1,1]."),
  bodyRuns([boldRun("Key parameter: "), normalRun("grid_n (integer, metres, default: 1000).")]),
  bodyRuns([boldRun("Output columns: "), new TextRun({ text: "EASTING, NORTHING, DIP, DIP_DIR, count, kappa, beta", font: "Courier New", size: 20 })]),

  // 5.5 Outlier removal
  h2("5.5  Method 5 — Outlier Removal (Single-Removal per Cell)"),
  body("For each grid cell containing more than 3 measurements, every point is tentatively removed in turn and kappa is recomputed for the remaining dataset. The point whose removal produces the greatest increase in kappa (maximum Δκ) is identified as the outlier and permanently removed. The remaining measurements are then averaged using spherical statistics to produce the representative orientation for the cell."),
  body("Cells with 3 or fewer measurements are excluded from the output, as insufficient data remain for reliable Kent distribution parameter estimation."),
  bodyRuns([boldRun("Key parameter: "), normalRun("grid_n (integer, metres, default: 1000).")]),
  bodyRuns([boldRun("Output columns: "), new TextRun({ text: "EASTING, NORTHING, DIP, DIP_DIR, count, kappa, beta, REMOVED_INDEX", font: "Courier New", size: 20 })]),
  bodyRuns([boldRun("Limitation: "), normalRun("Conservative — removes at most one outlier per cell regardless of cell size. Cells with ≤3 measurements are excluded entirely.")]),

  // 5.6 Carmichael
  h2("5.6  Method 5b — Carmichael Iterative Outlier Removal"),
  body("An extension of Method 5 implementing the iterative Δκ-break algorithm described by Carmichael & Ailleres (2016). Points within each cell are ranked by angular distance from the cell mean direction (farthest first) and removed iteratively. After each removal, kappa is recomputed and the change (Δκ) is recorded. The step with the largest Δκ defines the outlier boundary; all points removed up to and including that step are treated as outliers and discarded."),
  body("At most N÷2 points may be removed from a cell of N measurements. If no removal step produces a positive Δκ, the cell is left unchanged. Cells with 3 or fewer measurements are excluded from the output."),
  bodyRuns([boldRun("Key parameter: "), normalRun("grid_n (integer, metres, default: 1000).")]),
  bodyRuns([boldRun("Output columns: "), new TextRun({ text: "EASTING, NORTHING, DIP, DIP_DIR, count, kappa, beta, n_removed", font: "Courier New", size: 20 })]),
  note("Carmichael iterative removal is computationally more intensive than single-removal (Method 5) because it re-estimates kappa up to N/2 times per cell. For large datasets with small grid cells, runtime may be significant."),

  // 5.7 First-order
  h2("5.7  Method 6 — First-Order Subsampling"),
  body("Retains measurements based on two simultaneous geometric criteria relative to geological contacts. Contacts are derived automatically from the boundaries of the geology polygon shapefile supplied via geology_file. A measurement is retained only when both of the following conditions are satisfied:"),
  bodyRuns([boldRun("(a) Proximity — "), normalRun("the measurement must lie within dist_buffer metres of the nearest contact line (Euclidean distance in projected coordinates).")]),
  bodyRuns([boldRun("(b) Angular alignment — "), normalRun("the bedding strike (dip_direction − 90) must differ from the nearest contact segment azimuth by no more than angle_tol degrees. The angular comparison uses a modulo-180 convention to handle strike ambiguity.")]),
  body("The nearest-contact azimuth for each candidate point is obtained via a spatial join (gpd.sjoin_nearest) to a per-segment contact GeoDataFrame. A fallback implementation is included for GeoPandas versions prior to 0.10 that do not support sjoin_nearest."),
  bodyRuns([boldRun("Key parameters: "), normalRun("dist_buffer (metres, default: 500); angle_tol (degrees, default: 15).")]),
  bodyRuns([boldRun("Output: "), new TextRun({ text: "structure_file_firstorder_d{dist}_a{angle}.shp  /  .csv", font: "Courier New", size: 20 })]),
  bodyRuns([boldRun("Cartesian sweep: "), normalRun("When both dist_buffer and angle_tol are provided as lists, the full Cartesian product of combinations is run. For example, 3 distances × 3 angles = 9 independent output files.")]),
];

// ── Section 6: Parameter Sweeps ───────────────────────────────────────────────
const sec6 = [
  h1("6  Tolerance Parameter Sweeps"),
  body("All tolerance parameters (grid_n, decimation_n, stoch_frac, dist_buffer, angle_tol) accept either a single value or a Python list of values. When a list is provided, the method is run once per value and every result is saved with a parameter-encoded filename, ensuring no run overwrites another."),
  body("This design is intended to support systematic sensitivity analysis: a single function call can generate a complete series of subsampled datasets across a range of resolutions or tolerances, which can then be individually used as inputs to 3D modelling workflows and compared."),
  body("Example — running grid-cell averaging at five resolutions in a single call:"),
  ...codeBlock([
    "results = subsample_structures_file(",
    "    input_file  = 'inputs/bedding.shp',",
    "    output_dir  = 'outputs/',",
    "    methods     = ['gridcell_average'],",
    "    grid_n      = [500, 1000, 2000, 5000, 10000],",
    ")",
    "# Produces: structure_file_gridcell_500.shp",
    "#           structure_file_gridcell_1000.shp",
    "#           structure_file_gridcell_2000.shp",
    "#           structure_file_gridcell_5000.shp",
    "#           structure_file_gridcell_10000.shp",
  ]),
  body("For the first-order method, supplying lists for both dist_buffer and angle_tol generates the full Cartesian product of all distance×angle combinations. For example, 3 distances × 6 angles = 18 output files from a single call."),
];

// ── Section 7: Usage Examples ─────────────────────────────────────────────────
const sec7 = [
  h1("7  Usage Examples"),

  h2("7.1  Full Pipeline — All Methods, Default Tolerances"),
  body("The simplest invocation runs all seven methods on a bedding shapefile with standard column names and no feature-type filter:"),
  ...codeBlock([
    "from structpts_subsample import subsample_structures_file",
    "",
    "results = subsample_structures_file(",
    "    input_file        = 'inputs/bedding.shp',",
    "    output_dir        = 'outputs/',",
    "    geology_file      = 'inputs/geology.shp',",
    "    dip_input_col     = 'DIP',",
    "    dipdir_input_col  = 'DIP_DIR',",
    "    dipdir_input_type = 'dip_direction',",
    "    methods           = 'all',",
    "    grid_n            = 1000,",
    "    verbose           = True,",
    ")",
    "print(results)",
  ]),

  h2("7.2  Strike Input with Feature Filter"),
  body("This example handles a raw shapefile where the dip direction is recorded as strike and the file contains mixed feature types that must be filtered to bedding only:"),
  ...codeBlock([
    "results = subsample_structures_file(",
    "    input_file        = 'inputs/warox_planar_Clip.shp',",
    "    output_dir        = 'outputs/ninghan/',",
    "    geology_file      = 'inputs/500KClipped4_M2LFIX.shp',",
    "    dip_input_col     = 'DIP',",
    "    dipdir_input_col  = 'STRIKE',",
    "    dipdir_input_type = 'strike',          # triggers (strike + 90) % 360",
    "    filter_col        = 'FEATURE',",
    "    filter_val        = 'Bedding, showing strike and dip',",
    "    methods           = ['gridcell_average', 'spherical_kent',",
    "                         'outlier_removal'],",
    "    grid_n            = [500, 1000, 2000],",
    ")",
  ]),

  h2("7.3  First-Order Cartesian Parameter Sweep"),
  body("Sweep the full grid of distance buffer and angle tolerance combinations. The result dictionary keys encode each combination:"),
  ...codeBlock([
    "results = subsample_structures_file(",
    "    input_file   = 'inputs/bedding.shp',",
    "    output_dir   = 'outputs/firstorder/',",
    "    geology_file = 'inputs/geology.shp',",
    "    methods      = ['firstorder'],",
    "    dist_buffer  = [250, 500, 1000, 2000],",
    "    angle_tol    = [10, 15, 20],",
    ")",
    "# Produces 12 output files:",
    "# structure_file_firstorder_d250_a10.shp",
    "# structure_file_firstorder_d250_a15.shp  ... etc.",
  ]),

  h2("7.4  Using the Engine Class Directly"),
  body("For fine-grained control, instantiate SubsamplingEngine and call individual methods. This is useful when integrating the engine into a larger processing pipeline:"),
  ...codeBlock([
    "import geopandas as gpd",
    "from structpts_subsample import (SubsamplingEngine,",
    "                                           save_grid_to_shapefile)",
    "",
    "gdf    = gpd.read_file('input_beddings_only/bedding.shp')",
    "engine = SubsamplingEngine()          # uses standard column names",
    "bounds = gdf.total_bounds             # [min_x, min_y, max_x, max_y]",
    "minx, maxx = int(bounds[0]), int(bounds[2]) + 1",
    "miny, maxy = int(bounds[1]), int(bounds[3]) + 1",
    "",
    "# Method 4: spherical statistics at 1 km grid",
    "fname  = engine.spherical_kent(gdf, minx, maxx, miny, maxy,",
    "                               n=1000, path_out='outputs/')",
    "result = save_grid_to_shapefile('outputs/', fname)",
    "print(result[['DIP', 'DIP_DIR', 'kappa', 'beta']].describe())",
    "",
    "# Method 1: decimate to every 3rd point",
    "dec = engine.decimation(gdf, n=3, path_out='outputs/')",
    "print(f'Retained {len(dec)} of {len(gdf)} measurements')",
  ]),
];

// ── Section 8: Output File Reference ─────────────────────────────────────────
const outputTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [2000, 3600, 900, 2860],
  rows: [
    new TableRow({ children: [hCell("Method", 2000), hCell("Filename Pattern", 3600), hCell("Format", 900), hCell("Additional Columns", 2860)] }),
    new TableRow({ children: [dCell("Decimation", 2000, "FFFFFF"), dCell("structure_file_decimation_{n}", 3600, "FFFFFF"), dCell(".shp + .csv", 900, "FFFFFF"), dCell("Original attributes retained", 2860, "FFFFFF")] }),
    new TableRow({ children: [dCell("Stochastic", 2000, ALT_ROW), dCell("structure_file_stochastic_{frac}", 3600, ALT_ROW), dCell(".shp + .csv", 900, ALT_ROW), dCell("Original attributes retained", 2860, ALT_ROW)] }),
    new TableRow({ children: [dCell("Grid-cell average", 2000, "FFFFFF"), dCell("structure_file_gridcell_{n}", 3600, "FFFFFF"), dCell(".shp + .csv", 900, "FFFFFF"), dCell("EASTING, NORTHING, DIP, DIP_DIR", 2860, "FFFFFF")] }),
    new TableRow({ children: [dCell("Spherical Kent", 2000, ALT_ROW), dCell("structure_file_spherical_{n}", 3600, ALT_ROW), dCell(".shp + .csv", 900, ALT_ROW), dCell("count, kappa, beta", 2860, ALT_ROW)] }),
    new TableRow({ children: [dCell("Outlier removal", 2000, "FFFFFF"), dCell("structure_file_outlier_{n}", 3600, "FFFFFF"), dCell(".shp + .csv", 900, "FFFFFF"), dCell("count, kappa, beta, REMOVED_INDEX", 2860, "FFFFFF")] }),
    new TableRow({ children: [dCell("Outlier Carmichael", 2000, ALT_ROW), dCell("structure_file_outlier_carmichael_{n}", 3600, ALT_ROW), dCell(".shp + .csv", 900, ALT_ROW), dCell("count, kappa, beta, n_removed", 2860, ALT_ROW)] }),
    new TableRow({ children: [dCell("First-order", 2000, "FFFFFF"), dCell("structure_file_firstorder_d{dist}_a{angle}", 3600, "FFFFFF"), dCell(".shp + .csv", 900, "FFFFFF"), dCell("Original attributes retained", 2860, "FFFFFF")] }),
  ],
});

const sec8 = [
  h1("8  Output File Reference"),
  body("Each method writes both a point shapefile (.shp) and a comma-separated values file (.csv) to the specified output_dir. Filenames encode the method and tolerance parameter so that sweeps across multiple values produce independent, non-overwriting outputs."),
  blankRow(),
  outputTable,
  blankRow(),
  note("For grid-cell methods (Methods 3–5b), the representative measurement is positioned at the geometric centre of the grid cell (centx = linex + n/2, centy = liney + n/2). Cells containing no measurements are omitted from the output. Cells with 3 or fewer measurements are omitted from the outlier removal outputs."),
];

// ── Section 9: Method Selection Guide ─────────────────────────────────────────
const selTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [2000, 2400, 2480, 2480],
  rows: [
    new TableRow({ children: [hCell("Method", 2000), hCell("Best Suited For", 2400), hCell("Key Strength", 2480), hCell("Key Limitation", 2480)] }),
    new TableRow({ children: [dCell("Decimation", 2000, "FFFFFF"), dCell("Rapid exploration; single-trend, dense datasets", 2400, "FFFFFF"), dCell("Computationally trivial; no parameters to tune", 2480, "FFFFFF"), dCell("Digitisation-order dependent; no spatial awareness", 2480, "FFFFFF")] }),
    new TableRow({ children: [dCell("Stochastic", 2000, ALT_ROW), dCell("Statistical analysis; reproducibility not critical", 2400, ALT_ROW), dCell("Unbiased; avoids systematic sampling artefacts", 2480, ALT_ROW), dCell("Spatial distribution not considered; seed-dependent", 2480, ALT_ROW)] }),
    new TableRow({ children: [dCell("Grid-cell average", 2000, "FFFFFF"), dCell("Regional modelling; smooth spatial representation", 2400, "FFFFFF"), dCell("Predictable reduction; computationally efficient", 2480, "FFFFFF"), dCell("Orientation distribution within cells ignored", 2480, "FFFFFF")] }),
    new TableRow({ children: [dCell("Spherical Kent", 2000, ALT_ROW), dCell("Asymmetric or complex orientation distributions", 2400, ALT_ROW), dCell("Statistically rigorous; provides kappa and beta diagnostics", 2480, ALT_ROW), dCell("Higher cost; sensitive to grid size", 2480, ALT_ROW)] }),
    new TableRow({ children: [dCell("Outlier removal", 2000, "FFFFFF"), dCell("Datasets with known measurement errors", 2400, "FFFFFF"), dCell("Superior strike preservation; removes spurious data", 2480, "FFFFFF"), dCell("Single outlier only; cells ≤3 excluded", 2480, "FFFFFF")] }),
    new TableRow({ children: [dCell("Outlier Carmichael", 2000, ALT_ROW), dCell("Multiple coherent outliers per cell expected", 2400, ALT_ROW), dCell("Adaptive multi-outlier removal up to N/2", 2480, ALT_ROW), dCell("Computationally intensive; cells ≤3 excluded", 2480, ALT_ROW)] }),
    new TableRow({ children: [dCell("First-order", 2000, "FFFFFF"), dCell("Complex structural settings with known contacts", 2400, "FFFFFF"), dCell("Geologically informed; preserves all surfaces", 2480, "FFFFFF"), dCell("Requires geology shapefile; parameter-sensitive", 2480, "FFFFFF")] }),
  ],
});

const sec9 = [
  h1("9  Method Selection Guide"),
  body("The following table summarises the comparative strengths and limitations of each subsampling method, to assist in selecting the most appropriate approach for a given dataset and modelling objective."),
  blankRow(),
  selTable,
  blankRow(),
  body("In practice, running multiple methods and comparing 3D model outputs is strongly recommended. The parameter sweep functionality is designed to facilitate this comparison with minimal additional effort."),
];

// ── Section 10: References ────────────────────────────────────────────────────
const sec10 = [
  h1("10  References"),
  bodyRuns([
    boldRun("Carmichael, T. & Ailleres, L. (2016). "),
    normalRun("Method and analysis for the upscaling of structural data. "),
    new TextRun({ text: "Journal of Structural Geology", font: "Arial", size: 22, italics: true }),
    normalRun(", 83, 121–133. https://doi.org/10.1016/j.jsg.2015.09.003"),
  ]),
  bodyRuns([
    boldRun("Kent, J.T. (1982). "),
    normalRun("The Fisher–Bingham distribution on the sphere. "),
    new TextRun({ text: "Journal of the Royal Statistical Society Series B", font: "Arial", size: 22, italics: true }),
    normalRun(", 44(1), 71–80."),
  ]),
  bodyRuns([
    boldRun("Leong, L.S. & Carlile, J.C. (1998). "),
    normalRun("A method for estimating the Kent distribution parameters for orientation data. "),
    new TextRun({ text: "Mathematical Geology", font: "Arial", size: 22, italics: true }),
    normalRun("."),
  ]),
  bodyRuns([
    boldRun("Putz, M., Klötzli, U., Siebel, W. & Schmid, R. (2006). "),
    normalRun("Application of the Monte Carlo method in geochronology. "),
    new TextRun({ text: "Contributions to Mineralogy and Petrology", font: "Arial", size: 22, italics: true }),
    normalRun(", 152(4), 501–514."),
  ]),
];

// =============================================================================
// ASSEMBLE DOCUMENT
// =============================================================================
const mainChildren = [
  ...sec1,
  ...sec2,
  ...sec3,
  ...sec4,
  ...sec5,
  ...sec6,
  ...sec7,
  ...sec8,
  ...sec9,
  ...sec10,
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22, color: "000000" },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 32, bold: true, font: "Arial", color: DARK_BLUE },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 26, bold: true, font: "Arial", color: MED_BLUE },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 22, bold: true, font: "Arial", color: MED_BLUE },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    // ── Title page (no footer) ────────────────────────────────────────────────
    titleSection,
    // ── Main content (with footer) ────────────────────────────────────────────
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      footers: { default: pageFooter },
      children: mainChildren,
    },
  ],
});

// =============================================================================
// WRITE FILE
// =============================================================================
const outPath = path.join(
  __dirname,
  "structural_subsampling_manual_v1.docx"
);

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`Written: ${outPath}  (${kb} KB)`);
}).catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
