# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools[woff]==4.60.1", "brotli==1.2.0"]
# ///
"""Rebuild both subsets from the pinned upstream TTF, without changing site copy."""
import argparse
import hashlib
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("characters", type=Path)
parser.add_argument("destination", type=Path)
parser.add_argument("--og-font", type=Path, help="Also emit the bold subset as server-only TTF for next/og")
args = parser.parse_args()
args.destination.mkdir(parents=True, exist_ok=True)
text = args.characters.read_text()
source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
if source_hash != "a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da":
    raise ValueError("Source font differs from the documented upstream SHA-256")
manifest = {"sourceSha256": source_hash, "fonts": []}
for weight in [400, 700]:
    font = TTFont(args.source, recalcTimestamp=False)
    instantiateVariableFont(font, {"wght": weight}, inplace=True, updateFontNames=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.recalc_timestamp = False
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    worker = subset.Subsetter(options=options)
    worker.populate(text=text)
    worker.subset(font)
    font.flavor = "woff2"
    path = args.destination / f"noto-sans-sc-{weight}.woff2"
    font.save(path)
    codepoints = sorted(font.getBestCmap())
    manifest["fonts"].append({"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "codepoints": codepoints})
    print(f"{path.name}: {path.stat().st_size} bytes, {len(codepoints)} codepoints")
(args.destination / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
if args.og_font:
    args.og_font.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(args.destination / "noto-sans-sc-700.woff2", recalcTimestamp=False)
    font.flavor = None
    font.save(args.og_font)
    print(f"Server OG font: {args.og_font} ({args.og_font.stat().st_size} bytes)")
