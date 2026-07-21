# Personal Website

The homepage is an interactive Three.js skywriting scene. The previous homepage is preserved at `/old/`; the rest of the static portfolio pages are unchanged.

## Run locally

From the project directory:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173/`. Three.js is loaded as a pinned ES module from jsDelivr, so the interactive plane requires an internet connection during local testing.

The ArtiLike section fetches data from a daily-updated JSON endpoint and renders image, caption, and creator cards.
