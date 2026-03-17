# CS-6180 Project Gallery

A static website for showcasing CS-6180 student projects. Deployed via AWS Amplify — no backend, no framework.

---

## For TAs: Adding a New Team

### Option A — Script (recommended)

```bash
node scripts/new-team.js team-slug "Team Display Name"
# Example:
node scripts/new-team.js team-alpha "Team Alpha"
```

This creates `teams/team-alpha/`, populates it from the template, and regenerates the manifest automatically.

### Option B — Copy the template manually

1. Copy the `teams/_template/` folder and rename it (lowercase, hyphens only, e.g. `team-alpha`)
2. Edit `teams/team-alpha/project.json` with the team's info
3. Edit `teams/team-alpha/README.md` with the project content
4. Run `node scripts/build.js` (or `npm run build`) to regenerate the manifest

**That's it — push to `main` and Amplify deploys automatically.**

---

## Team Folder Structure

```
teams/team-alpha/
├── index.html       # Do not edit unless you need custom HTML (see below)
├── README.md        # Project write-up — edit this
├── project.json     # Gallery card metadata — edit this
└── assets/
    ├── thumbnail.png   # Gallery card image (any image, ~16:9 recommended)
    ├── screenshot.png  # Used inside README.md
    └── demo.mp4        # Optional local video (YouTube embed is preferred)
```

---

## project.json Fields

```json
{
  "name": "Team Alpha",
  "title": "My Project Title",
  "members": ["Alice Smith", "Bob Jones"],
  "description": "One sentence for the gallery card.",
  "thumbnail": "assets/thumbnail.png",
  "tags": ["reinforcement-learning", "robotics"]
}
```

All fields are optional — the gallery won't break if any are missing.

---

## Supported Project Page Formats

| Format | How to set it up |
|--------|-----------------|
| **Markdown** (default) | Edit `README.md`. Supports headings, images, tables, code, YouTube embeds. |
| **Custom HTML** | Open `index.html`, remove the `<script src="../../js/project-loader.js">` line, write your HTML inside `<main id="content">`. |
| **Full-page image** | Custom HTML mode — put a single `<img>` tag inside `<main>`. |
| **Complex markdown + local images** | Reference images as `assets/image.png` in `README.md` — paths resolve automatically. |

---

## Embedding Videos

**YouTube (recommended — keeps repo size small):**
```markdown
<iframe width="720" height="405" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

**Local video file:**
```markdown
<video width="720" controls><source src="assets/demo.mp4" type="video/mp4"></video>
```

> **Note:** Avoid committing large video files to git. Use YouTube or Google Drive embeds instead.

---

## Previewing Locally

`fetch()` requires a local HTTP server (won't work from `file://`).

```bash
npx serve .
# Then open http://localhost:3000
```

---

## How Deployment Works

1. Push to `main`
2. AWS Amplify runs `node scripts/build.js` (regenerates `teams/manifest.json`)
3. Deploys all files as static assets
4. The GitHub Action also commits the updated manifest back to the repo on each push

---

## Updating Course Info

Edit the header in `index.html`:
```html
<h1>CS-6180 Project Gallery</h1>
<p>Spring 2025 — Student Projects</p>
```
