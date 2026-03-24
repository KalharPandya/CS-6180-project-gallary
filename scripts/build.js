const fs = require('fs');
const path = require('path');

const teamsDir = path.join(__dirname, '..', 'teams');

function buildManifest() {
  if (!fs.existsSync(teamsDir)) {
    fs.mkdirSync(teamsDir, { recursive: true });
  }

  const entries = fs.readdirSync(teamsDir, { withFileTypes: true });
  const teams = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_')) continue;

    const teamDir = path.join(teamsDir, entry.name);
    const metaPath = path.join(teamDir, 'project.json');
    let meta = {};

    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      // Graceful fallback for missing/malformed project.json
    }

    const slug = entry.name;
    const thumbnailRel = meta.thumbnail || 'assets/thumbnail.png';
    const thumbnailPath = path.join(teamDir, thumbnailRel);
    const hasThumbnail = fs.existsSync(thumbnailPath);

    teams.push({
      slug,
      name: meta.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      title: meta.title || 'Untitled Project',
      members: meta.members || [],
      description: meta.description || '',
      thumbnail: hasThumbnail ? `teams/${slug}/${thumbnailRel}` : null,
      poster: meta.poster || null,
      video: meta.video || null,
      tags: meta.tags || []
    });
  }

  teams.sort((a, b) => a.name.localeCompare(b.name));

  const manifestPath = path.join(teamsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(teams, null, 2));
  console.log(`Generated manifest with ${teams.length} team(s)`);
}

buildManifest();
