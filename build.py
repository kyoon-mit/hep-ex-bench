"""Render content/*.md into template.html and write index.html.

usage: uv run --no-project --with markdown-it-py python build.py
"""
import html
import re
import uuid
from pathlib import Path

from markdown_it import MarkdownIt

HERE = Path(__file__).resolve().parent
MATH = re.compile(r"(\$\$.+?\$\$|\\\[.+?\\\]|\\\(.+?\\\)|(?<![\\$\w])\$(?!\s)[^$\n]+?(?<!\s)\$(?!\w))", re.S)
MD = MarkdownIt("commonmark", {"html": True}).enable("table")


def render(text: str) -> str:
    """CommonMark (with tables) to HTML; TeX is kept as written for KaTeX in the browser."""
    tag = "MATH" + uuid.uuid4().hex
    assert tag not in text
    keep: list[str] = []

    def stash(m):
        keep.append(m.group(0))
        return f"{tag}x{len(keep) - 1}x"

    body = MATH.sub(stash, text.replace(' markdown="1"', ""))
    out = MD.render(body)
    return re.sub(tag + r"x(\d+)x", lambda m: html.escape(keep[int(m.group(1))], quote=False), out)


def main() -> None:
    page = (HERE / "template.html").read_text()
    for name in re.findall(r"<!--content/([\w-]+)\.md-->", page):
        page = page.replace(f"<!--content/{name}.md-->", render((HERE / "content" / f"{name}.md").read_text()))
    (HERE / "index.html").write_text(page)
    print(f"wrote {HERE / 'index.html'} ({len(page.encode())} bytes)")


if __name__ == "__main__":
    main()
