# Academic website

Source of <https://gurjeetsinghsangra.github.io/academic/> — a small, dependency-light Jekyll site.

## Editing content

| What | Where |
| --- | --- |
| Bio, research themes, home page | `index.html` |
| Publications (abstract, links, BibTeX) | `_data/publications.yml` |
| News | `_data/news.yml` |
| Projects / MIGRATE | `projects.html` |
| Name, email, social links, nav | `_config.yml` |
| Site check (used in CI) | `test/check_site.py` |
| Styles / scripts | `assets/css/main.scss`, `assets/js/main.js` |

## Run locally

```bash
bundle install
bundle exec jekyll serve --livereload    # http://localhost:4000/academic/
```

## Test

```bash
bundle exec jekyll build
python3 test/check_site.py    # every internal link, anchor and image must resolve
```

Pushing to `master` builds, tests and deploys to the `gh-pages` branch via GitHub Actions.
