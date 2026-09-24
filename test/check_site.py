#!/usr/bin/env python3
"""Check the built site: every internal link, anchor, image, script and stylesheet must resolve.

Usage: python3 test/check_site.py [_site] [--baseurl /academic]
"""
import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.imgs_without_alt = set(), [], 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and a.get("name"):
            self.ids.add(a["name"])
        for attr in ("href", "src", "srcset"):
            if a.get(attr) and not (tag == "link" and a.get("rel") in ("preconnect", "icon")):
                self.refs.append((tag, a[attr].split()[0]))
        if tag == "img" and not a.get("alt"):
            self.imgs_without_alt += 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site", nargs="?", default="_site")
    ap.add_argument("--baseurl", default="/academic")
    args = ap.parse_args()
    root = Path(args.site).resolve()
    base = args.baseurl.rstrip("/")

    pages = {}
    for f in root.rglob("*.html"):
        p = Page()
        p.feed(f.read_text(encoding="utf-8"))
        url = base + "/" + str(f.relative_to(root)).replace("index.html", "")
        pages[url] = (f, p)

    def resolve(path):
        rel = path[len(base):].lstrip("/") if path.startswith(base) else None
        if rel is None:
            return None
        target = root / unquote(rel)
        if target.is_dir():
            target = target / "index.html"
        return target if target.is_file() else None

    errors = []
    checked = 0
    for url, (f, page) in sorted(pages.items()):
        where = f.relative_to(root)
        if page.imgs_without_alt:
            errors.append(f"{where}: {page.imgs_without_alt} <img> without alt text")
        for tag, ref in page.refs:
            u = urlparse(ref)
            if u.scheme in ("http", "https", "mailto", "tel", "data") or ref.startswith("//"):
                continue
            checked += 1
            absolute = urlparse(urljoin(url, ref))
            target = resolve(absolute.path)
            if target is None:
                errors.append(f"{where}: <{tag}> {ref} -> missing file")
                continue
            if absolute.fragment and target.suffix == ".html":
                target_url = base + "/" + str(target.relative_to(root)).replace("index.html", "")
                if absolute.fragment not in pages[target_url][1].ids:
                    errors.append(f"{where}: <{tag}> {ref} -> missing #{absolute.fragment}")

    print(f"Checked {checked} internal references across {len(pages)} pages.")
    for e in errors:
        print("  ✗", e)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
