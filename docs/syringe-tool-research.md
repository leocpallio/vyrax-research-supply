# Syringe measuring tool: research notes (2 Nov 2026)

Sources read on 2 Nov 2026: pepdose.com, calculatepeptide.com, howmuchbacwater.com, peptidedeck.com (home and calculator index), plus the pattern used by pharmacy oral-syringe "fill to here" widgets. Repo sources: src/data/reconstitution.ts, src/routes/calculator.tsx, src/styles.css.

## What the existing tools do well

1. Single screen, live result. calculatepeptide.com recalculates on every keystroke and shows the answer as one large number ("Draw to 10 units") with the ml equivalent underneath. No submit button. We copy this.
2. Preset chips plus free entry. pepdose.com offers 5/10/20/50 mg and 1/2/3/5 ml chips with an "Other" field. Fast on mobile because most visitors use stock vial sizes. We use the strengths actually in our catalogue as chips, never generic therapeutic presets.
3. Syringe choice changes the scale, not the maths. calculatepeptide.com lists U-100 0.3/0.5/1 ml and explains that only the final ml to units step changes. We show both the U-100 unit scale and the ml scale on the same barrel so the relationship is visible.
4. Shown working. calculatepeptide.com has a "Show the math" panel: concentration, target, volume, units. This builds trust and lets a lab check the number. We do the same, always open, three lines.
5. Guard rails. calculatepeptide.com warns "Draw exceeds syringe capacity" and "Volume is too small to measure accurately". We add the concrete fix: the smallest listed syringe that holds the volume, and the diluent volume that would bring the draw to the barrel.
6. Visual fill. pepdose.com draws a graduated barrel with the fill level. Pharmacy oral-syringe widgets add a plunger edge marker with a label at the line ("fill to here"). We combine both: fill, plunger, and a callout at the exact graduation.

## What they do badly (and we avoid)

1. Dosing language throughout ("dose", "inject", "doses per vial", injection syringe). Our tool is a laboratory volumetric measuring tool: target mass, draw volume, aliquot. No dose suggestions, no count of "doses per vial".
2. Default target values (pepdose prefills 250 mcg, calculatepeptide prefills 250 mcg). This implies a therapeutic amount. Our target mass field starts empty.
3. Ads, affiliate banners and partner GLP-1 promotions (peptidedeck, howmuchbacwater). None here.
4. No keyboard support on the visual. Our plunger is a slider (role="slider") with arrow keys stepping one graduation and Page keys ten.
5. Layout jumps when warnings appear. We reserve a fixed-height status area.
6. Silent rounding. We say what the nearest graduation is and how far the true volume sits from it.

## Real syringe scales used

- 0.3 ml U-100: 30 units, minor mark every 0.5 unit (0.005 ml), labelled every 5 units.
- 0.5 ml U-100: 50 units, minor mark every 1 unit (0.01 ml), labelled every 5 units.
- 1 ml U-100: 100 units, minor mark every 2 units (0.02 ml), labelled every 10 units.
- 3 ml luer syringe: no unit scale, minor mark every 0.1 ml, labelled every 0.5 ml. Units are shown as ml-equivalent only (U-100 conversion is 100 units per ml, so 3 ml would be 300 units, which no unit-marked barrel carries).
- Conversion: U-100 means 100 units per ml, so units = ml x 100. "Units" here are syringe graduations, not IU of biological activity. The tool says so, because IU is a potency unit that cannot be derived from mass without a compound-specific activity figure, and the catalogue holds none.

## Repo data and constraints

- 50 records in dilutionRecords. Two have withholdConcentrations (melanotan-2, adamax): the tool prints no arithmetic for them, matching the existing calculator. One readyToUse (l-carnitine, supplied as a solution) and one diluent (bacteriostatic water): no reconstitution step, the tool explains instead.
- One record carries a concentration ceiling: cjc-1295-dac, unverified supplier guidance near 2 mg/ml. The tool warns above it and labels it unverified.
- Design tokens: navy ink oklch(0.153 0.061 269.5) (about #14213D), accent #5B8DEF, muted text about #6B7688, Satoshi variable font, paper background, line #DDD7C8.

## Animation plan

- Plunger and fill tween with a CSS transition on transform (GPU, no layout). 450 ms ease-out.
- Vial: liquid level rises when diluent is set, a short swirl ripple when concentration changes, then a draw-down when the syringe fills.
- prefers-reduced-motion: all transitions set to 0 ms, swirl removed.
- Fixed SVG viewBox and aspect-ratio boxes, so nothing shifts.
