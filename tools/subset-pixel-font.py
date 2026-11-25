"""Subset Fusion Pixel 12px Proportional zh_hans TTF to a compact offline WOFF2 covering all game text."""
import sys
import zipfile
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options, save_font

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path(
    r'C:\Users\HNU\.gemini\antigravity\brain\797c21cc-4ab6-4633-b647-79e96a03bacb\scratch\fusion-pixel-12px-proportional-ttf.zip'
)
OUT_WOFF2 = ROOT / 'assets/fonts/fusion-pixel-12px.woff2'
OUT_LICENSE = ROOT / 'assets/licenses/OFL-fusion-pixel-font.txt'


def collect_chars() -> set[str]:
    chars: set[str] = set()
    # Printable ASCII
    for cp in range(0x20, 0x7F):
        chars.add(chr(cp))
    # Essential CJK punctuation, symbols, arrows, and UI icons
    extra = (
        '\u3000，。！？、；：‘’“”（）【】《》「」『』—…·•×÷±°‰'
        '○●◆◇★☆☐☑☒■□▪▫▴▾▸◂→←↑↓⇄↔↧▤'
        '–—―…‥※'
        '0123456789'
    )
    chars.update(extra)

    scan_paths = [ROOT / 'index.html']
    for folder, exts in [
        (ROOT / 'src', {'.js', '.css', '.json'}),
        (ROOT / 'data', {'.json'}),
    ]:
        for p in folder.rglob('*'):
            if p.suffix.lower() in exts and p.is_file():
                scan_paths.append(p)

    for p in scan_paths:
        text = p.read_text(encoding='utf-8', errors='ignore')
        for ch in text:
            if ord(ch) >= 0x20:
                chars.add(ch)
    return chars


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    OUT_WOFF2.parent.mkdir(parents=True, exist_ok=True)
    OUT_LICENSE.parent.mkdir(parents=True, exist_ok=True)

    if src.suffix.lower() == '.zip':
        ttf_tmp = src.parent / 'fusion-pixel-12px-proportional-zh_hans.ttf'
        with zipfile.ZipFile(src) as zf:
            OUT_LICENSE.write_bytes(zf.read('OFL.txt'))
            ttf_tmp.write_bytes(zf.read('fusion-pixel-12px-proportional-zh_hans.ttf'))
        ttf_path = ttf_tmp
    else:
        ttf_path = src

    font = TTFont(str(ttf_path))
    cmap = font.getBestCmap() or {}
    chars = collect_chars()
    present = sorted(ord(c) for c in chars if ord(c) in cmap)
    missing = sorted(c for c in chars if ord(c) not in cmap and ord(c) > 0x7F)
    print(f'Collected {len(chars)} unique chars -> {len(present)} in font cmap')
    if missing:
        print('Missing from font cmap:', ''.join(missing), [hex(ord(c)) for c in missing])
    else:
        print('Missing from font cmap: NONE (100% coverage!)')

    options = Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 11, 13, 14]
    options.desubroutinize = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=present)
    subsetter.subset(font)
    save_font(font, str(OUT_WOFF2), options)
    print(f'Wrote {OUT_WOFF2} ({OUT_WOFF2.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
