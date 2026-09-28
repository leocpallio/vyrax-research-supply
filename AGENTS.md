<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Storefront catalogue and known launch prices live in `src/lib/catalog.ts`; one source keeps category, search, basket and product listings consistent.
- Order checkout is an enquiry, not a paid sale; payment and trading claims require verified business, courier and batch documentation first.
- Shared shop chrome lives in `src/components/Store.tsx` and leaf pages retain their own metadata; this keeps navigation and research warnings consistent.

- Promotional totals are calculated in `src/lib/catalog.ts`; the basket and enquiry must use the same calculation to prevent mismatched prices.
- Customer-facing research sections are mapped in `src/data/shop-sections.ts` separately from legacy category URLs, so existing links survive the navigation change.
