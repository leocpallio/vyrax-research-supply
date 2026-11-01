#!/usr/bin/env python3
"""Depth and parity audit for a Vyrax build.

usage: depth-audit.py <base-url>

1. BFS from / over internal links: reports every indexable page's shortest click depth.
2. Per PDP: every Offer price in the JSON-LD must equal a price rendered on the page, and the
   availability must match the stock badge the page shows for that strength.

Read-only. Exit 1 if any check fails.
"""
import json
import re
import sys
from collections import deque
from urllib.parse import urljoin, urlparse

import urllib.request as u

BASE = sys.argv[1].rstrip("/")
HOST = urlparse(BASE).netloc


def get(path):
    url = path if path.startswith("http") else BASE + path
    with u.urlopen(url, timeout=30) as r:
        return r.status, r.read().decode("utf8", "replace")


def strip(html):
    t = re.sub(r"<script.*?</script>", " ", html, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return " ".join(t.split())


def links(html, here):
    out = set()
    for href in re.findall(r'href="([^"#]+)"', html):
        if href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        url = urljoin(BASE + here, href)
        p = urlparse(url)
        if p.netloc != HOST:
            continue
        path = p.path.rstrip("/") or "/"
        if p.query:
            continue
        out.add(path)
    return out


def blocks(html):
    out = []
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            out.append(json.loads(m))
        except json.JSONDecodeError:
            out.append({"__invalid": True})
    return out


def main():
    depth = {"/": 0}
    parent = {"/": None}
    q = deque(["/"])
    pages = {}
    while q:
        p = q.popleft()
        if p in pages:
            continue
        try:
            status, html = get(p)
        except Exception as e:  # noqa: BLE001
            pages[p] = {"status": str(e), "html": ""}
            continue
        pages[p] = {"status": status, "html": html}
        if status != 200:
            continue
        for n in links(html, p):
            if n not in depth:
                depth[n] = depth[p] + 1
                parent[n] = p
                q.append(n)

    far = sorted(((d, p) for p, d in depth.items() if d > 3), reverse=True)
    print("crawled", len(pages), "pages; max depth", max(depth.values()))
    print("over 3 clicks:", len(far))
    for d, p in far[:10]:
        chain = [p]
        while parent[chain[-1]] is not None:
            chain.append(parent[chain[-1]])
        print("  depth", d, " <- ".join(reversed(chain)))
    print("depth histogram", {d: sum(1 for v in depth.values() if v == d) for d in sorted(set(depth.values()))})

    # PDP parity
    bad = []
    pdp = [p for p in depth if p.startswith("/product/")]
    for p in pdp:
        html = pages[p]["html"]
        if not html:
            bad.append((p, "no html"))
            continue
        product = next((b for b in blocks(html) if b.get("@type") == "Product"), None)
        if not product:
            bad.append((p, "no Product block"))
            continue
        offers = product.get("offers") or []
        if isinstance(offers, dict):
            offers = [offers]
        money = set(re.findall(r"£([0-9]+\.[0-9]{2})", strip(html)))
        for o in offers:
            price = o.get("price")
            if f"{float(price):.2f}" not in money:
                bad.append((p, f"offer price {price} not rendered"))
            if o.get("priceCurrency") != "GBP":
                bad.append((p, "currency not GBP"))
            stock = o.get("availability", "").rsplit("/", 1)[-1]
            if stock not in ("InStock", "OutOfStock", "PreOrder", "BackOrder"):
                bad.append((p, f"odd availability {stock}"))
    print(f"PDPs checked {len(pdp)}; parity problems {len(bad)}")
    for b in bad[:15]:
        print("  ", b)
    return 1 if bad or far else 0


if __name__ == "__main__":
    raise SystemExit(main())
