---
name: image-to-ppt
description: Use when a user asks to deconstruct a flat image, screenshot, infographic, UI mockup, architecture diagram, or visual slide into separate SVG assets and rebuild it as an editable, reusable PowerPoint PPTX rather than a pasted bitmap.
---

# Image To PPT

## Overview

Recreate a source image as a reusable PowerPoint artifact by extracting every visual asset into its own SVG file, then rebuilding the layout with editable PPT text, shapes, connectors, and embedded SVG assets.

The hard requirement is separation: one visual material equals one standalone SVG. The final PPTX must not be a single screenshot or flattened background.

## Output Contract

Always deliver:

- `output/<descriptive-name>.pptx`
- `output/svg-assets/*.svg`
- `output/svg-asset-manifest.json`
- `output/verification-report.json`

The PPTX must be reusable:

- Text must be editable PowerPoint text wherever readable text exists in the source.
- Panels, cards, bars, connectors, arrows, dividers, and backgrounds must be editable PPT shapes or lines.
- Icons, illustrations, decorative elements, repeated symbols, and extracted picture materials must each be independent SVG files and embedded as separate assets.
- Do not place the original image as a full-slide background in the PPT.
- Do not merge unrelated icons or materials into one SVG just because they are near each other.

## Workflow

1. Inspect the source image dimensions, visual hierarchy, and repeated elements.
2. Build an asset inventory before generating files.
3. Extract or redraw every non-text visual material as an individual SVG.
4. Save every SVG under `svg-assets/` with semantic names.
5. Create `svg-asset-manifest.json` listing each asset name, file path, role, and where it appears.
6. Rebuild the PPT with editable primitives:
   - Native text boxes for all text.
   - Native shapes for boxes, bands, pills, bars, backgrounds, simple arrows, and dividers.
   - Native connector lines for relationships and flow direction.
   - Separate embedded SVGs for icons, illustrations, and decorations.
7. Verify the PPTX package and update the build until all checks pass.

## Asset Inventory Rules

Before writing the PPT, list every visual material:

| Source element | Required output |
|---|---|
| Icon | One standalone SVG per icon role or occurrence |
| Repeated icon with different semantic role | Separate SVG with role-specific name |
| Decorative background curve/ring/pattern | Separate SVG per decorative unit |
| Flow arrow or directional glyph | Separate SVG if it is an image-like material; editable PPT line/shape if simple |
| Logo, mascot, product UI, brand mark | Use only user-provided or verified source asset; never invent a lookalike |
| Text | Editable PPT text, not baked into SVG unless the user explicitly asks |

Naming pattern:

```text
icon-01-user-command.svg
icon-02-business-flow.svg
flow-arrow-01-left-to-center.svg
bg-decoration-01-top-right-rings.svg
```

Use stable numbering so the manifest, files, and PPT placements can be compared.

## SVG Requirements

Each SVG must:

- Be a valid standalone `.svg` file.
- Have its own `viewBox`.
- Contain only the material named by the file.
- Avoid embedded raster images unless the source material is truly photographic or cannot be vectorized faithfully.
- Avoid text inside SVG when the text should be editable in PPT.
- Preserve visual meaning over pixel-perfect noise.

For common interface icons, redraw as vector paths using local icon libraries when appropriate. For custom source-specific icons, author simple SVG paths manually or trace the visible form conservatively.

## PPT Rebuild Rules

Rebuild the slide at the source aspect ratio when possible. For a single image-derived slide, use a custom layout matching source dimensions or a proportional 16:9 layout.

The PPT should be useful for editing:

- Use grouped-looking structure through alignment and object names, not by flattening.
- Use editable PPT shapes for containers and bands.
- Keep connectors editable and semantically directed.
- Keep text separate from icons so labels can be changed.
- Use the SVG assets as independent objects, placed at the appropriate coordinates.
- If using a JS PPT generator, keep the generation script or coordinate map in the workspace for reproducibility unless the user asks only for final files.

Do not:

- Export the whole rebuilt page as one SVG and place it into PPT.
- Use the original image as a full-slide background.
- Hide missing assets by flattening a region into a screenshot.
- Combine multiple icons into a sprite sheet unless the user explicitly asks for a sprite output in addition to the individual SVGs.

## Verification

Run mechanical checks before claiming completion.

Required checks:

- Final PPTX exists and is non-empty.
- Slide count matches the requested output.
- `svg-assets/` contains every item from the manifest.
- PPTX embeds the expected number of SVG assets.
- PPTX does not embed the original source image as a full-slide background.
- PPTX slide XML contains editable text runs for major labels.
- PPTX slide XML contains editable shape objects for the layout.

Use `scripts/verify_pptx_assets.js` when working in Node:

```bash
node scripts/verify_pptx_assets.js \
  --pptx output/ai-os-editable-rebuild.pptx \
  --asset-dir output/svg-assets \
  --manifest output/svg-asset-manifest.json \
  --expected-slides 1 \
  --expected-svg 38 \
  --source-name image_task_01KRRMGNBX1H2DPE4HX7DY1PF1_0
```

If a renderer is available, also render the PPTX or slide preview and inspect it visually. Package checks prove editability and asset separation; rendered review catches layout defects.

## Completion Checklist

Before final response, confirm:

- Every visual material from the source has a separate SVG file.
- Every SVG file is named and listed in the manifest.
- Every SVG intended for the slide is embedded separately in the PPT.
- Text, cards, connectors, bands, and major layout pieces are editable PPT objects.
- The original source bitmap is not used as a background or hidden full-page layer.
- Any residual gap is stated plainly, especially if exact OCR text or tiny details could not be recovered.

Final response should link only the user-facing deliverables: PPTX, SVG folder, manifest, and verification report.
