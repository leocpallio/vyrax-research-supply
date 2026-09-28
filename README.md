# Vyrax Research Supply

Build a UK research-peptide storefront called Vyrax Labs (domain vyraxlabs.co.uk). Clinical research register, UK spelling, no em-dashes, no dosing or human-use claims. Every page carries "For research use only - not for human consumption."

DESIGN SYSTEM. Light theme. Primary #1D4ED8, hover #1E40AF, soft tint #EFF4FF, navy #0B1B33 for dark sections, background #FFFFFF, surfaces #F6F8FB, borders #E3E8F0, text #0F172A, muted #64748B, verification green #16A34A (CoA badges and tested claims ONLY), promo amber #F59E0B (sale badges ONLY), danger #DC2626. Fonts: Inter for body/UI, Sora for headings, JetBrains Mono for lab data like batch codes and purity percentages. H1 40-56px 600, body 16px/1.6. 4px spacing scale, container 1280px, card radius 16px, buttons 12px, hero CTAs pill. Product cards: image top with purity/size badge chips, name line-clamp-2, price with "from £X", add-to-cart pill, CoA link icon in green, hover lift. Navy full-bleed band for the verification section and footer.

HOMEPAGE in this order: 1) announcement bar, navy, "10% off over £150 | 15% over £250 | 20% over £400". 2) hero: H1 "Buy Peptides UK. Lab-Tested, Verified Research Supplier." subhead on HPLC + Mass Spectrometry verification and same-day dispatch before 2pm, pill CTA "Browse Peptides", ghost CTA "View CoA Hub", trust strip beneath with stars and CoA/HPLC/ISO icons. 3) research-use disclaimer strip. 4) best-sellers grid. 5) catalogue breadth stat "43 research compounds, UK in-stock". 6) process section, 4 steps from synthesis to delivery. 7) why-us icons: testing, dispatch, support, discretion. 8) browse by research category. 9) SEO block "Where to buy peptides in the UK" plus FAQ accordion on legality, quality, who can order, delivery. 10) third-party verification section with a CoA quick-view widget (select peptide, see the batch certificate inline). 11) bundles with strikethrough save pricing. 12) reviews. 13) blog links. 14) email capture for a free reconstitution guide.

CATEGORIES: metabolic-research (Retatrutide, Tirzepatide, Semaglutide, AOD-9604, Tesamorelin, 5-Amino-1MQ, MOTS-c), regenerative-research (BPC-157, TB-500, GHK-Cu, KPV, LL-37, Wolverine stack), gh-secretagogues (CJC-1295 DAC and no-DAC, Ipamorelin, GHRP-2/6, IGF-1 LR3), longevity-research (NAD+, Epithalon, DSIP, SS-31), pigmentation-research (Melanotan-2, PT-141), peptide-blends (GLOW 70mg, KLOW 80mg, Hulk stack), lab-supplies (bacteriostatic water, syringes, wipes, pens).

PRODUCT PAGES at /product/{slug}, one page per compound, strengths as variants. Above the fold: bare-name H1, GBP price, strength selector, pack-size selector with save percentages, specific batch purity number (never a generic claim), in-stock indicator, delivery line with cut-off and free-shipping threshold, add-to-basket, cost-per-mg comparator, research-use strip. Body in order: research overview with 3-4 PubMed links, what-is section, comparison vs related compound, research applications in in-vitro language, specs table (CAS, formula, weight, sequence, concentration, appearance, storage, classification, verification method), purity and testing with batch number, CoA block (downloadable PDF plus QR link), reconstitution guide with bacteriostatic water cross-sell, storage instructions, FAQ accordion, related products, reviews. Product JSON-LD with GBP offers, shipping threshold, 14-day return policy, purity as additionalProperty. Free UK delivery over £50, same-day dispatch before 2pm.

TITLE FORMULAS: product pages "Buy {Product} {mg} UK | >99% Tested | Vyrax Labs", homepage "Buy Peptides UK · Lab-Tested Research | Vyrax Labs", categories "Buy {Category} UK | Lab-Tested Research Peptides | Vyrax Labs". Brand always last, never first.

LAUNCH PRICES: Retatrutide £59.99/10mg, Tirzepatide £54.99/10mg, Semaglutide £19.99/5mg, BPC-157 £15.99/5mg and £29.99/10mg, TB-500 £21.99/5mg and £37.99/10mg, GHK-Cu £19.99/50mg and £37.99/100mg, CJC-1295 no-DAC £24.99/5mg, Ipamorelin £18.99/5mg, GLOW 70mg £59.99. Launch promo: B2G1 free on Retatrutide 10mg and Tirzepatide 20mg.

MUST-HAVE FEATURES: 18+ age gate with research-purpose confirmation, public CoA/Lab Reports page linked from every product, full footer legal set with UK company number, shipping page naming a tracked courier with discreet packaging, returns page with free-reshipment language, payment icon row plus one non-card option, account system with order history and guest checkout, on-site reviews with star ratings, search with peptide autocomplete, storage and handling guides, FAQ page.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vyrax-research-supply.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0400fa8e-254f-4b2d-a5de-716c4e8d7f42).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
