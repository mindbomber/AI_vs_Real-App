# AI vs Real Art Quiz

Interactive app where users guess whether an artwork is human-made or AI-generated.

## Local run

1. Open a terminal in this folder.
2. Start the app:

```bash
npm start
```

3. Open:

```text
http://127.0.0.1:3000
```

## GitHub Pages

This project is now static and GitHub Pages compatible:

- Root entry file: `index.html`
- Image list source: `image-manifest.json`
- Jekyll disabled via `.nojekyll`
- Auto manifest updates via GitHub Actions workflow: `.github/workflows/update-image-manifest.yml`

Set GitHub Pages to deploy from the repository root on your chosen branch.

## Dataset folders used for manifest generation

- `assets/Art/RealArt` (or fallback: `assets/RealArt`)
- `assets/Art/AiArtData` (or fallback: `assets/AiArtData`)

## Regenerating the manifest

- Local: `npm run build:manifest`
- CI: runs automatically on push when files in `assets/**` change
