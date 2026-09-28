# Vyrax Labs pricing basis

Every catalogue price, next to the UK competitor listings it was benchmarked against.
Source: live scrapes of 12 UK storefronts on 28 Sep 2026 (astralabs, ukpeptidelab, oplabs, proformapeptides,
midshirelabs, crownpeptides, imperialpeptides, peptideslabuk, uk-peptides, pharmalabglobal, rndpeptides, my-peptides).
Raw data: `peptide-intel/vyrax/raw/*.html` and `extracted_pairs.json` on the ops box.

Rule of thumb used: at or just under the competitor median for commodity SKUs (BPC-157, TB-500, GHK-Cu),
undercut the only GLP-1 competitors on per-mg price at higher strengths, and hold price where only one
competitor was observed. Rows marked "no benchmark" were priced by per-mg interpolation from the same
compound or its closest analogue, and should be checked against supplier cost before launch.

| Compound | Strength | Vyrax | Per unit | Competitors seen | Min | Median | Max | Position |
|---|---|---|---|---|---|---|---|---|
| Retatrutide | 10mg | £59.99 | £6.00/mg | astralabs £59.99, peptideslabuk £98.99 | £59.99 | £79.49 | £98.99 | 25% below median |
| Retatrutide | 20mg | £79.99 | £4.00/mg | astralabs £79.99 | £79.99 | £79.99 | £79.99 | at market (within 3%) |
| Retatrutide | 30mg | £109.99 | £3.67/mg | astralabs £119.99, peptideslabuk £246.00 | £119.99 | £183.00 | £246.00 | 40% below median |
| Retatrutide | 60mg | £159.99 | £2.67/mg | astralabs £159.99 | £159.99 | £159.99 | £159.99 | at market (within 3%) |
| Tirzepatide | 10mg | £54.99 | £5.50/mg | astralabs £44.99, peptideslabuk £82.99 | £44.99 | £63.99 | £82.99 | 14% below median |
| Tirzepatide | 20mg | £64.99 | £3.25/mg | astralabs £64.99 | £64.99 | £64.99 | £64.99 | at market (within 3%) |
| Tirzepatide | 40mg | £99.99 | £2.50/mg | astralabs £99.99 | £99.99 | £99.99 | £99.99 | at market (within 3%) |
| Tirzepatide | 60mg | £139.99 | £2.33/mg | astralabs £139.99, peptideslabuk £279.00 | £139.99 | £209.50 | £279.00 | 33% below median |
| Semaglutide | 5mg | £19.99 | £4.00/mg | astralabs £19.99, peptideslabuk £59.00 | £19.99 | £39.49 | £59.00 | 49% below median |
| Semaglutide | 10mg | £34.99 | £3.50/mg | peptideslabuk £82.99 | £82.99 | £82.99 | £82.99 | 58% below median |
| Cagrilintide | 5mg | £39.99 | £8.00/mg | oplabs £29.99, astralabs £47.99 | £29.99 | £38.99 | £47.99 | at market (within 3%) |
| AOD-9604 | 5mg | £24.99 | £5.00/mg | midshirelabs £25.00 | £25.00 | £25.00 | £25.00 | at market (within 3%) |
| AOD-9604 | 10mg | £44.99 | £4.50/mg | astralabs £49.99 | £49.99 | £49.99 | £49.99 | 10% below median |
| 5-Amino-1MQ | 50mg | £39.99 | £0.80/mg | no benchmark | | | | interpolated |
| MOTS-c | 10mg | £24.99 | £2.50/mg | oplabs £18.99, astralabs £29.99 | £18.99 | £24.49 | £29.99 | at market (within 3%) |
| MOTS-c | 40mg | £46.99 | £1.17/mg | astralabs £47.99 | £47.99 | £47.99 | £47.99 | at market (within 3%) |
| BPC-157 | 5mg | £15.99 | £3.20/mg | oplabs £13.99, midshirelabs £15.00, proformapeptides £15.99, ukpeptides £16.95, peptideslabuk £17.99, ukpeptidelab £17.99, crownpeptides £19.99 | £13.99 | £16.95 | £19.99 | 6% below median |
| BPC-157 | 10mg | £29.99 | £3.00/mg | astralabs £25.00, midshirelabs £25.00, imperial £29.99, proformapeptides £29.99, imperialpeptides £29.99, crownpeptides £32.99 | £25.00 | £29.99 | £32.99 | at market (within 3%) |
| TB-500 | 5mg | £21.99 | £4.40/mg | oplabs £18.40, imperialpeptides £21.99, proformapeptides £22.99, ukpeptidelab £23.99, crownpeptides £24.99 | £18.40 | £22.99 | £24.99 | 4% below median |
| TB-500 | 10mg | £37.99 | £3.80/mg | proformapeptides £34.99, crownpeptides £37.99, peptideslabuk £39.99, astralabs £44.99 | £34.99 | £38.99 | £44.99 | at market (within 3%) |
| GHK-Cu | 50mg | £19.99 | £0.40/mg | imperialpeptides £15.99, oplabs £15.99, ukpeptidelab £19.99, astralabs £20.00, proformapeptides £24.99, crownpeptides £24.99, ukpeptides £26.99, peptideslabuk £37.99 | £15.99 | £22.49 | £37.99 | 11% below median |
| GHK-Cu | 100mg | £37.99 | £0.38/mg | proformapeptides £44.99, crownpeptides £48.99, peptideslabuk £69.99 | £44.99 | £48.99 | £69.99 | 22% below median |
| KPV | 10mg | £24.99 | £2.50/mg | ukpeptidelab £24.99, astralabs £34.99 | £24.99 | £29.99 | £34.99 | 17% below median |
| LL-37 | 5mg | £29.99 | £6.00/mg | oplabs £29.95, ukpeptidelab £34.99 | £29.95 | £32.47 | £34.99 | 8% below median |
| ARA-290 | 10mg | £24.99 | £2.50/mg | oplabs £24.90 | £24.90 | £24.90 | £24.90 | at market (within 3%) |
| CJC-1295 no-DAC | 5mg | £24.99 | £5.00/mg | imperialpeptides £24.99, ukpeptides £25.95 | £24.99 | £25.47 | £25.95 | at market (within 3%) |
| CJC-1295 DAC | 5mg | £34.99 | £7.00/mg | midshirelabs £35.00 | £35.00 | £35.00 | £35.00 | at market (within 3%) |
| Ipamorelin | 5mg | £18.99 | £3.80/mg | oplabs £15.52 | £15.52 | £15.52 | £15.52 | 22% above median |
| Ipamorelin | 10mg | £32.99 | £3.30/mg | astralabs £34.99 | £34.99 | £34.99 | £34.99 | 6% below median |
| Tesamorelin | 5mg | £27.99 | £5.60/mg | oplabs £27.90, astralabs £27.99 | £27.90 | £27.95 | £27.99 | at market (within 3%) |
| Tesamorelin | 10mg | £49.99 | £5.00/mg | peptideslabuk £114.99 | £114.99 | £114.99 | £114.99 | 57% below median |
| GHRP-2 | 5mg | £9.99 | £2.00/mg | no benchmark | | | | interpolated |
| GHRP-2 | 10mg | £14.99 | £1.50/mg | oplabs £9.99, midshirelabs £15.00 | £9.99 | £12.50 | £15.00 | 20% above median |
| GHRP-6 | 5mg | £9.49 | £1.90/mg | oplabs £9.50 | £9.50 | £9.50 | £9.50 | at market (within 3%) |
| GHRP-6 | 10mg | £14.49 | £1.45/mg | midshirelabs £15.00 | £15.00 | £15.00 | £15.00 | 3% below median |
| Hexarelin | 2mg | £12.99 | £6.50/mg | oplabs £12.00 | £12.00 | £12.00 | £12.00 | 8% above median |
| Sermorelin | 2mg | £12.99 | £6.50/mg | oplabs £12.95 | £12.95 | £12.95 | £12.95 | at market (within 3%) |
| IGF-1 LR3 | 1mg | £39.99 | £39.99/mg | oplabs £34.95, midshirelabs £40.00, astralabs £49.99 | £34.95 | £40.00 | £49.99 | at market (within 3%) |
| NAD+ | 500mg | £39.99 | £0.08/mg | astralabs £40.00 | £40.00 | £40.00 | £40.00 | at market (within 3%) |
| Epithalon | 10mg | £19.99 | £2.00/mg | oplabs £14.99, astralabs £24.99 | £14.99 | £19.99 | £24.99 | at market (within 3%) |
| SS-31 | 10mg | £24.99 | £2.50/mg | oplabs £24.99 | £24.99 | £24.99 | £24.99 | at market (within 3%) |
| SS-31 | 50mg | £59.99 | £1.20/mg | astralabs £59.99 | £59.99 | £59.99 | £59.99 | at market (within 3%) |
| DSIP | 5mg | £13.99 | £2.80/mg | oplabs £13.95 | £13.95 | £13.95 | £13.95 | at market (within 3%) |
| DSIP | 10mg | £24.99 | £2.50/mg | astralabs £29.99 | £29.99 | £29.99 | £29.99 | 17% below median |
| Thymosin Alpha-1 | 5mg | £21.99 | £4.40/mg | oplabs £19.95 | £19.95 | £19.95 | £19.95 | 10% above median |
| Thymalin | 10mg | £21.99 | £2.20/mg | oplabs £19.90, ukpeptidelab £27.99 | £19.90 | £23.95 | £27.99 | 8% below median |
| Semax | 10mg | £24.99 | £2.50/mg | astralabs £25.00 | £25.00 | £25.00 | £25.00 | at market (within 3%) |
| Selank | 10mg | £24.99 | £2.50/mg | astralabs £25.00 | £25.00 | £25.00 | £25.00 | at market (within 3%) |
| Melanotan 2 | 10mg | £21.99 | £2.20/mg | astralabs £24.99, ukpeptidelab £24.99 | £24.99 | £24.99 | £24.99 | 12% below median |
| Melanotan 1 | 10mg | £19.99 | £2.00/mg | ukpeptidelab £19.99 | £19.99 | £19.99 | £19.99 | at market (within 3%) |
| PT-141 | 10mg | £19.99 | £2.00/mg | oplabs £16.99, astralabs £19.99, ukpeptidelab £21.99 | £16.99 | £19.99 | £21.99 | at market (within 3%) |
| GLOW | 70mg | £59.99 | £0.86/mg | ukpeptidelab £59.99, astralabs £65.00 | £59.99 | £62.50 | £65.00 | 4% below median |
| KLOW | 80mg | £67.99 | £0.85/mg | astralabs £69.99, ukpeptidelab £69.99 | £69.99 | £69.99 | £69.99 | at market (within 3%) |
| Wolverine Stack | 5+5mg | £36.99 | £3.70/mg | oplabs £26.90, astralabs £45.00 | £26.90 | £35.95 | £45.00 | at market (within 3%) |
| Hulk Stack | 20mg | £69.99 | £3.50/mg | no benchmark | | | | interpolated |
| Bacteriostatic Water | 10ml | £5.99 | £0.60/ml | oplabs £5.90, peptideslabuk £6.99 | £5.90 | £6.45 | £6.99 | 7% below median |

3 strengths had no direct competitor observation at that exact size.
