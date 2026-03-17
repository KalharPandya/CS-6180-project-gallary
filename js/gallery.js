(() => {
  const gallery = document.getElementById('gallery');
  const searchInput = document.getElementById('search');
  let allTeams = [];

  function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function renderCard(team) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `teams/${team.slug}/index.html`;

    const thumb = team.thumbnail
      ? `<img class="card-thumbnail" src="${team.thumbnail}" alt="${team.name}" loading="lazy">`
      : `<div class="card-placeholder">${initials(team.name)}</div>`;

    const tags = (team.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    card.innerHTML = `
      ${thumb}
      <div class="card-body">
        <div class="card-team">${team.name}</div>
        <div class="card-title">${team.title}</div>
        ${team.description ? `<div class="card-desc">${team.description}</div>` : ''}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      </div>
    `;
    return card;
  }

  function renderGallery(teams) {
    gallery.innerHTML = '';
    if (teams.length === 0) {
      gallery.innerHTML = `
        <div class="empty-state">
          <h2>No projects found</h2>
          <p>Try a different search term.</p>
        </div>`;
      return;
    }
    teams.forEach(t => gallery.appendChild(renderCard(t)));
  }

  function filterTeams(query) {
    const q = query.toLowerCase().trim();
    if (!q) return allTeams;
    return allTeams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q)) ||
      (t.members || []).some(m => m.toLowerCase().includes(q))
    );
  }

  searchInput.addEventListener('input', () => {
    renderGallery(filterTeams(searchInput.value));
  });

  fetch('teams/manifest.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(teams => {
      allTeams = teams;
      renderGallery(allTeams);
    })
    .catch(() => {
      gallery.innerHTML = `
        <div class="empty-state">
          <h2>No projects yet</h2>
          <p>Projects will appear here once teams are added.</p>
        </div>`;
    });
})();
