"""Fügt src/ zu einer einzelnen HTML-Datei zusammen.

Aufruf:  python3 build.py [vorschau.html]
Schreibt Feld-und-Kondensator.html (ohne Dokument-Gerüst, so wie das Artifact es erwartet).
Mit Pfadangabe zusätzlich eine lokale Vorschau mit Gerüst zum Testen im Browser.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
JS = ["content.js", "sims.js", "figs.js", "app.js"]

shell = (SRC / "shell.html").read_text(encoding="utf-8")
css = (SRC / "style.css").read_text(encoding="utf-8")
js = "\n".join((SRC / f).read_text(encoding="utf-8") for f in JS)
page = shell.replace("/*STYLE*/", css).replace("/*JS*/", js)
(ROOT / "Feld-und-Kondensator.html").write_text(page, encoding="utf-8")

if len(sys.argv) > 1:
    skeleton = (
        '<!doctype html><html lang="de"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        "<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}"
        "body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>"
        "</head><body>" + page + "</body></html>"
    )
    pathlib.Path(sys.argv[1]).write_text(skeleton, encoding="utf-8")
print(f"{len(page) // 1024} KB")
