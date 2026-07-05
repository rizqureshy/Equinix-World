#!/usr/bin/env python3
"""Bundle the app into one portable HTML file (dist/Deal_Command_Center.html).

Inlines css/app.css and every <script src> (including the vendored Three.js)
so the result can be emailed, dropped in Slack, or opened from file:// with
zero dependencies. Run from the repo root:  python3 tools/build_single_file.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "DealProof.html"

html = (ROOT / "index.html").read_text(encoding="utf-8")

def inline_css(m):
    css = (ROOT / m.group(1)).read_text(encoding="utf-8")
    return "<style>\n" + css + "\n</style>"

def inline_js(m):
    js = (ROOT / m.group(1)).read_text(encoding="utf-8")
    # a literal </script> inside JS source would terminate the inline tag early
    js = js.replace("</script>", "<\\/script>")
    return "<script>\n" + js + "\n</script>"

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
