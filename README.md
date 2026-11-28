# Agentic LIGO benchmark monitor

This branch (`gh-pages`) holds only the benchmark monitor, served by GitHub Pages
at https://kyoon-mit.github.io/agentic-ligo/. It shares no history with the
harness code on `main` and `ligo-benchmarks`.

| File | What it is |
|---|---|
| `index.html` | The page. Generated: edit `template.html` and `content/`, then rebuild. |
| `template.html` | The page's panels; `<!--content/NAME.md-->` marks where text goes. |
| `content/*.md` | The reference text (How it works, Scoring, Data, Agents, Results, Sources), written by the project session. |
| `runs.json` | Published runs shown on the leaderboard (agents, reference searches, scorer tests). Only published results; the field list is in its `note`. |
| `monitor.js` | The interactives, the panels and the leaderboard. |
| `monitor.css` | Styles; colors are the tokens of kyoon-mit.github.io. |
| `build.py` | Renders `content/*.md` into `template.html` and writes `index.html`. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |

Rebuild after changing `template.html` or `content/`:

    uv run --no-project --with markdown-it-py python build.py

`runs.json` needs no rebuild; the page reads it when it loads. Anyone can also
open a results file from their own computer on the leaderboard; it is read in
the browser and never uploaded, so unpublished runs can be viewed without
committing them here.
