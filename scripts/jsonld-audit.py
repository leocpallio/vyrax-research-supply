#!/usr/bin/env python3
"""Audit JSON-LD depth on a Vyrax build or the live site.

usage: jsonld-audit.py <base-url> <out.json> [--limit N]

Checks, per URL:
  - every ld+json block parses; list of @type values
  - Product: name/offers present, price, availability, priceValidUntil,
    shippingDetails.deliveryTime, hasMerchantReturnPolicy, aggregateRating/review absent
  - each FAQPage question+answer string appears in the visible page text
  - BreadcrumbList present
  - Organization: sameAs list, telephone, hasMerchantReturnPolicy, paymentAccepted
  - banned/fabricated keys: legalName, vatID, taxID, aggregateRating, review, foundingDate with no source
  - ContactPage present on /contact
"""
import json
import sys
import re
from concurrent.futures import ThreadPoolExecutor

import requests
from lxml import html as LH

BASE = sys.argv[1].rstrip("/")
OUT = sys.argv[2]
LIMIT = 0
if "--limit" in sys.argv:
    LIMIT = int(sys.argv[sys.argv.index("--limit") + 1])

S = requests.Session()
S.headers["User-Agent"] = "VyraxJsonLdAudit/1.0 (+seo)"
SITE = "https://vyraxlabs.co.uk"


def visible_text(doc):
    for bad in doc.xpath("//script|//style|//noscript"):
        bad.getparent().remove(bad)
    body = doc.body if doc.body is not None else doc
    return " ".join(" ".join(body.itertext()).split())


def norm(s):
    return " ".join((s or "").split())


def audit(path):
    url = BASE + path
    rec = {"path": path, "status": 0, "types": [], "issues": [], "blocks": 0}
    try:
        r = S.get(url, timeout=60)
    except Exception as e:  # noqa: BLE001
        rec["issues"].append(f"fetch error {e}")
        return rec
    rec["status"] = r.status_code
    if r.status_code != 200:
        return rec
    doc = LH.fromstring(r.text)
    blocks = []
    for raw in doc.xpath('//script[@type="application/ld+json"]/text()'):
        rec["blocks"] += 1
        try:
            blocks.append(json.loads(raw))
        except Exception as e:  # noqa: BLE001
            rec["issues"].append(f"ld+json parse error: {e}")
    types = []
    for b in blocks:
        for obj in b if isinstance(b, list) else [b]:
            t = obj.get("@type")
            if isinstance(t, list):
                types.extend(t)
            elif t:
                types.append(t)
    rec["types"] = types
    text = norm(visible_text(doc))

    def first(kind):
        for b in blocks:
            for obj in b if isinstance(b, list) else [b]:
                t = obj.get("@type")
                tl = t if isinstance(t, list) else [t]
                if kind in tl:
                    return obj
        return None

    prod = first("Product")
    if prod is not None:
        rec["product"] = prod.get("name")
        o = prod.get("offers") or {}
        rec["offer"] = {
            "price": o.get("price"),
            "currency": o.get("priceCurrency"),
            "availability": (o.get("availability") or "").rsplit("/", 1)[-1],
            "priceValidUntil": o.get("priceValidUntil"),
        }
        if not o:
            rec["issues"].append("product: no offers")
        else:
            if not o.get("priceValidUntil"):
                rec["issues"].append("offers: no priceValidUntil")
            sd = o.get("shippingDetails") or {}
            if not sd:
                rec["issues"].append("offers: no shippingDetails")
            elif not sd.get("deliveryTime"):
                rec["issues"].append("offers.shippingDetails: no deliveryTime")
            if not o.get("hasMerchantReturnPolicy"):
                rec["issues"].append("offers: no hasMerchantReturnPolicy")
        if "aggregateRating" in prod:
            rec["issues"].append("product: aggregateRating present")
        if "review" in prod:
            rec["issues"].append("product: review present")
        rec["desc_in_page"] = norm(prod.get("description") or "") in text

    faq = first("FAQPage")
    if faq is not None:
        qs = faq.get("mainEntity") or []
        missing = []
        for q in qs:
            qn = norm(q.get("name"))
            an = norm((q.get("acceptedAnswer") or {}).get("text"))
            if qn and qn not in text:
                missing.append(("q", qn[:60]))
            if an and an not in text:
                missing.append(("a", an[:60]))
        rec["faq"] = {"n": len(qs), "missing": len(missing), "sample": missing[:3]}
        if missing:
            rec["issues"].append(f"faq: {len(missing)} q/a strings not in visible text")

    rec["breadcrumb"] = first("BreadcrumbList") is not None
    if path != "/" and not rec["breadcrumb"]:
        rec["issues"].append("no BreadcrumbList")

    org = first("Organization")
    if org is not None:
        rec["org"] = {
            "sameAs": org.get("sameAs") or [],
            "telephone": org.get("telephone"),
            "email": org.get("email"),
            "paymentAccepted": org.get("paymentAccepted"),
            "hasMerchantReturnPolicy": "hasMerchantReturnPolicy" in org,
        }
    if path == "/contact":
        rec["contact_page"] = first("ContactPage") is not None
        if not rec["contact_page"]:
            rec["issues"].append("no ContactPage")

    banned = []
    for b in blocks:
        for obj in b if isinstance(b, list) else [b]:
            for k in ("legalName", "vatID", "taxID", "leiCode", "duns", "founder", "foundingDate"):
                if k in obj:
                    banned.append(k)
    if banned:
        rec["issues"].append("banned keys: " + ",".join(sorted(set(banned))))
    return rec


sitemap = S.get(SITE + "/sitemap.xml", timeout=60).text
paths = re.findall(r"<loc>(.*?)</loc>", sitemap)
paths = [p.replace(SITE, "") or "/" for p in paths]
if LIMIT:
    paths = paths[:LIMIT]
# Always include the pages this audit cares about.
for extra in ("/", "/contact", "/faq", "/lab-reports", "/shipping", "/returns", "/about"):
    if extra not in paths:
        paths.append(extra)

with ThreadPoolExecutor(max_workers=8) as ex:
    recs = list(ex.map(audit, paths))

summary = {}
for r in recs:
    for t in r["types"]:
        summary[t] = summary.get(t, 0) + 1
agg = {}
for r in recs:
    for i in r["issues"]:
        key = re.sub(r"\d+", "N", i.split(":")[0] + ":" + i.split(":")[1] if ":" in i else i)
        agg[key] = agg.get(key, 0) + 1

out = {"base": BASE, "urls": len(recs), "types": summary, "issue_counts": agg, "records": recs}
json.dump(out, open(OUT, "w"), indent=1)
print(json.dumps({"base": BASE, "urls": len(recs), "types": summary, "issues": agg}, indent=1))
