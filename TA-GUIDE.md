# CS-6180 Project Gallery — TA Guide

This guide explains everything you need to know to add and manage team project pages.

---

## Table of Contents

1. [How the site works](#how-the-site-works)
2. [Adding a new team (quick start)](#adding-a-new-team-quick-start)
3. [Folder structure explained](#folder-structure-explained)
4. [Editing project metadata](#editing-project-metadata)
5. [Writing the project page](#writing-the-project-page)
   - [Mode 1: Markdown report (default)](#mode-1-markdown-report-default)
   - [Mode 2: Image/poster only](#mode-2-imageposter-only)
   - [Mode 3: Video only](#mode-3-video-only)
   - [Mode 4: Custom HTML (shared styles)](#mode-4-custom-html-shared-styles)
   - [Mode 5: Fully custom page](#mode-5-fully-custom-page)
6. [Adding videos](#adding-videos)
7. [Adding images](#adding-images)
8. [Previewing locally](#previewing-locally)
9. [Deploying](#deploying)
10. [Troubleshooting](#troubleshooting)

---

## How the site works

```
Push to main → Amplify prebuild runs node scripts/build.js
                  ↓
             Scans teams/ folder
                  ↓
             Writes teams/manifest.json
                  ↓
             Site deploys → index.html fetches manifest → gallery renders
```

- The **landing page** (`index.html`) auto-discovers all teams by reading `teams/manifest.json`.
- The manifest is regenerated automatically on every push — you never edit it by hand.
- Each team has its own **self-contained folder** under `teams/`.
- No build step, no Node dependencies, no framework — just static files.

---

## Adding a new team (quick start)

### Option A — Script (recommended)

```bash
node scripts/new-team.js team-alpha "Team Alpha"
```

This will:
1. Copy `teams/_template/` → `teams/team-alpha/`
2. Set the team name in `project.json`
3. Regenerate `teams/manifest.json`

Then edit the two files inside the new folder:
- `project.json` — metadata for the gallery card
- `README.md` — the project page content

### Option B — Manual copy

1. Copy the `teams/_template/` folder and rename it (lowercase, hyphens only):
   ```
   teams/
   ├── _template/        ← copy this
   └── team-alpha/       ← paste and rename
   ```
2. Edit `teams/team-alpha/project.json`
3. Edit `teams/team-alpha/README.md`
4. Run `node scripts/build.js` to regenerate the manifest (or just push — Amplify does it automatically)

### Naming rules for the folder

| Good | Bad |
|------|-----|
| `team-alpha` | `Team Alpha` |
| `nlp-group-3` | `NLP Group 3` |
| `robotics-lab` | `robotics_lab` |

Lowercase, hyphens only, no spaces or underscores.

---

## Folder structure explained

```
teams/team-alpha/
├── index.html       ← project page (usually leave as-is)
├── README.md        ← markdown content (edit this!)
├── project.json     ← gallery card metadata (edit this!)
└── assets/
    ├── thumbnail.png  ← gallery card image (16:9 recommended)
    ├── figure1.png
    └── demo.mp4       ← optional local video
```

**You should edit:** `project.json`, `README.md`, and `assets/`
**Leave unchanged:** `index.html` (unless switching to a custom mode)

---

## Editing project metadata

`project.json` controls what appears on the gallery card:

```json
{
  "name": "Team Alpha",
  "title": "Project Title Here",
  "members": ["Alice Chen", "Bob Martinez"],
  "description": "One sentence describing the project for the gallery card.",
  "thumbnail": "assets/thumbnail.png",
  "tags": ["reinforcement-learning", "robotics"]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Team or group name |
| `title` | Yes | Project title, shown on the card |
| `members` | No | Used in search — students can find their own card |
| `description` | No | Short blurb shown on the card |
| `thumbnail` | No | Path relative to the team folder. If missing, a gradient placeholder is shown |
| `tags` | No | Used for search/filtering. Lowercase, hyphens |

**Thumbnail tips:**
- 16:9 aspect ratio works best
- PNG, JPG, SVG, or WebP
- Keep under 500KB for fast loading

---

## Writing the project page

There are 5 ways to build a project page. Pick whichever fits the team's content.

---

### Mode 1: Markdown report (default)

**Best for:** Full written reports with text, figures, tables, code, and video.

**How:** Just edit `README.md`. The `index.html` is already set up to load and render it.

```markdown
# Project Title

## Team Members
- Alice Chen (alice@example.com)

## Abstract
Short description.

## Demo Video
<iframe width="720" height="405" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

## Key Results
![My figure](assets/figure1.png)

| Method | Accuracy |
|--------|----------|
| Ours   | 94.1%    |
| Baseline | 81.2%  |

## Approach
Text here. Code blocks work too:

```python
model = BertForSequenceClassification.from_pretrained('bert-base-uncased')
```

## References
- [Paper Title](https://arxiv.org/abs/xxxx.xxxxx)
```

**Notes:**
- Images referenced as `assets/figure1.png` resolve relative to the team folder automatically.
- YouTube iframes are wrapped in a responsive 16:9 container automatically.
- Tables, code blocks with syntax highlighting, and footnotes all render correctly.

---

### Mode 2: Image/poster only

**Best for:** Teams submitting a single research poster or infographic.

**How:**
1. Open `index.html`
2. Remove the `<script src="../../js/project-loader.js"></script>` line at the bottom
3. Replace the `<main id="content">` body with your image:

```html
<main id="content">
  <h1>Project Title</h1>
  <p class="byline">Team Name — CS-6180</p>
  <img src="assets/poster.png" alt="Research Poster" style="width:100%;">
</main>
```

Upload the poster image to `assets/poster.png`.

---

### Mode 3: Video only

**Best for:** Demo videos with minimal surrounding text.

**How:**
1. Open `index.html`, remove the project-loader script
2. Add a video wrapper in `<main>`:

```html
<main id="content">
  <h1>Project Title</h1>
  <p class="byline">Team Name — CS-6180</p>

  <!-- YouTube embed (recommended) -->
  <div class="video-wrapper">
    <iframe src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
  </div>

  <!-- OR: local video file -->
  <div class="video-wrapper">
    <video controls><source src="assets/demo.mp4" type="video/mp4"></video>
  </div>
</main>
```

The `.video-wrapper` class makes the video responsive (fills the container at 16:9).

---

### Mode 4: Custom HTML (shared styles)

**Best for:** Teams who want full HTML control but still want the site's typography and nav styling.

**How:**
1. Open `index.html`, remove the project-loader script
2. Write any HTML you want inside `<main id="content">`:

```html
<main id="content">
  <h1>Project Title</h1>
  <p class="byline">Team Name — CS-6180</p>

  <h2>Abstract</h2>
  <p>Your content here...</p>

  <!-- You can use any HTML elements -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
    <img src="assets/fig1.png" alt="Figure 1">
    <img src="assets/fig2.png" alt="Figure 2">
  </div>

  <table>
    <thead><tr><th>Method</th><th>Score</th></tr></thead>
    <tbody>
      <tr><td>Ours</td><td>94.1%</td></tr>
    </tbody>
  </table>
</main>
```

Available CSS classes from `project.css`:
- `byline` — author/team subtitle under the title
- `video-wrapper` — responsive 16:9 video container
- `h1`, `h2`, `h3`, `p`, `table`, `code`, `pre` — all styled automatically

---

### Mode 5: Fully custom page

**Best for:** Teams with interactive demos, custom visualizations, or their own complete design.

**How:**
1. Replace the entire `index.html` with your own page.
2. Keep only the back-link so users can return to the gallery:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>
    /* Your own CSS here */
  </style>
</head>
<body>
  <a href="../../index.html" style="...">&larr; Back to Gallery</a>

  <!-- Anything goes here: interactive charts, Canvas, WebGL, React CDN, etc. -->

  <script>
    // Your own JS here
  </script>
</body>
</html>
```

**Live examples in this repo:**
- `teams/demo-markdown-only/` — Mode 1 (full markdown report)
- `teams/demo-image-only/` — Mode 2 (single poster image)
- `teams/demo-video-only/` — Mode 3 (video embed)
- `teams/demo-custom-html/` — Mode 4 (HTML with shared styles)
- `teams/demo-full-custom/` — Mode 5 (fully self-contained with interactive JS)

---

## Adding videos

### YouTube (recommended)

Embed using the YouTube iframe. Replace `VIDEO_ID` with the 11-character ID from the URL.

```markdown
<iframe width="720" height="405" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

For `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → `VIDEO_ID` is `dQw4w9WgXcQ`.

### Google Drive

1. Upload the video to Google Drive
2. Share → "Anyone with the link"
3. Click "..." → "Embed item" → copy the iframe src
4. Paste the iframe in your README.md

### Local video file

Upload `.mp4` to `assets/` and reference it:

```markdown
<video width="720" controls>
  <source src="assets/demo.mp4" type="video/mp4">
</video>
```

> ⚠️ Keep video files under 50MB. For larger videos, use YouTube or Google Drive. Git is not ideal for large binary files.

---

## Adding images

Place image files in `assets/` and reference them in markdown:

```markdown
![Figure caption](assets/figure1.png)
```

Or in HTML:

```html
<img src="assets/figure1.png" alt="Figure 1">
```

**Supported formats:** PNG, JPG, SVG, WebP, GIF
**Recommended max size:** 2MB per image
**Thumbnail:** Name it `thumbnail.png` (or `.jpg`, `.svg`) and update `project.json` accordingly.

---

## Previewing locally

You need a local HTTP server because the browser blocks `fetch()` over `file://`.

**Quickest option:**
```bash
npx serve .
```
Then open http://localhost:3000.

**Python (no install needed):**
```bash
python -m http.server 8000
```
Then open http://localhost:8000.

After adding a new team, run the manifest generator first:
```bash
node scripts/build.js
```
Then refresh the page.

---

## Deploying

The site deploys automatically via **AWS Amplify** whenever you push to `main`:

1. Amplify runs `node scripts/build.js` (regenerates `teams/manifest.json`)
2. Amplify deploys all static files
3. The site is live within 1–2 minutes

**You don't need to do anything special to deploy** — just `git push`.

A **GitHub Action** also auto-commits the manifest on push, so it's always in sync even for local development.

---

## Troubleshooting

### "Content coming soon" on a project page
- The page can't fetch `README.md`. Make sure the file exists in the team folder.
- Check you're viewing via a local server (`npx serve .`), not directly from the filesystem (`file://`).

### Team doesn't appear in the gallery
- Run `node scripts/build.js` locally and check the output.
- Make sure the team folder name doesn't start with `_`.
- Make sure `project.json` is valid JSON (check for trailing commas or missing quotes).

### Thumbnail not showing
- Make sure the path in `project.json` matches the actual file name (case-sensitive on Linux/Amplify).
- If the file doesn't exist, a colored placeholder is shown — that's expected.

### Video doesn't play
- YouTube embeds require an internet connection.
- Local `.mp4` files must be served over HTTP, not `file://`.
- Check the file path is correct and the file is in `assets/`.

### Markdown images broken
- Image paths in `README.md` must be relative to the team folder: `assets/image.png` not `/teams/team-alpha/assets/image.png`.
- File names are case-sensitive on the server.

### Build script error
- Run `node --version` — requires Node 14+.
- Check that `teams/` folder exists.
- Validate your `project.json` at https://jsonlint.com.
