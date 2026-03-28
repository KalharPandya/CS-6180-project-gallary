(() => {
  const SUPABASE_URL = 'https://vuisvmzvbvcglhgqtzbb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXN2bXp2YnZjZ2xoZ3F0emJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTAyMDUsImV4cCI6MjA5MDIyNjIwNX0.ULGNcr-vbH3mbGb4Kst4xihMJZNLuPv5YKHhPA-bTzk';

  /* ── Supabase client ─────────────────────────────── */
  let db;
  function getDB() {
    if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return db;
  }

  /* ── Relative time ───────────────────────────────── */
  function reltime(iso) {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60)   return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  /* ── Build tree from flat rows ───────────────────── */
  function buildTree(rows) {
    const map = {};
    rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
    const roots = [];
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });
    return roots;
  }

  /* ── Render a single node + its children ─────────── */
  function renderNode(node, slug, maxDepth = 6) {
    const wrap = document.createElement('div');
    wrap.className = 'qa-thread';
    wrap.dataset.id = node.id;

    const inner = document.createElement('div');
    inner.className = 'qa-node';
    inner.innerHTML = `
      <div class="qa-node-meta">
        <strong class="qa-node-author">${escHtml(node.author_name)}</strong>
        <span class="qa-node-time">${reltime(node.created_at)}</span>
      </div>
      <div class="qa-node-body">${escHtml(node.body)}</div>
      <div class="qa-node-actions">
        <button class="qa-reply-btn" type="button">&#128172; Reply</button>
      </div>
    `;

    const childWrap = document.createElement('div');
    childWrap.className = 'qa-children';

    // Render existing children recursively (cap visual indent at maxDepth)
    node.children.forEach(child => {
      childWrap.appendChild(renderNode(child, slug, maxDepth));
    });

    // Reply button toggles inline form
    inner.querySelector('.qa-reply-btn').addEventListener('click', function () {
      const existing = inner.querySelector('.qa-form--reply');
      if (existing) { existing.remove(); return; }
      const form = buildForm(slug, node.id, node.depth + 1, newNode => {
        childWrap.appendChild(renderNode(newNode, slug, maxDepth));
        form.remove();
      });
      form.classList.add('qa-form--reply');
      inner.querySelector('.qa-node-actions').after(form);
    });

    wrap.appendChild(inner);
    wrap.appendChild(childWrap);
    return wrap;
  }

  /* ── Render forest into a container ─────────────── */
  function renderForest(nodes, container, slug) {
    nodes.forEach(n => container.appendChild(renderNode(n, slug)));
  }

  /* ── Build a post/reply form ─────────────────────── */
  function buildForm(slug, parentId, depth, onSuccess) {
    const form = document.createElement('form');
    form.className = 'qa-form';
    form.innerHTML = `
      <input  class="qa-input" name="author_name" placeholder="Your name *" required maxlength="80" autocomplete="name">
      <input  class="qa-input" name="email" type="email" placeholder="Email (optional)" maxlength="120" autocomplete="email">
      <textarea class="qa-input qa-textarea" name="body" placeholder="${parentId ? 'Write a reply…' : 'Ask a question or start a discussion…'}" required maxlength="2000"></textarea>
      <div class="qa-form-actions">
        <button class="qa-submit" type="submit">${parentId ? 'Reply' : 'Post'}</button>
        ${parentId ? '<button class="qa-cancel" type="button">Cancel</button>' : ''}
      </div>
    `;

    form.querySelector('.qa-cancel')?.addEventListener('click', () => form.remove());

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.qa-submit');
      btn.disabled = true;
      btn.textContent = 'Posting…';

      const row = {
        team_slug:   slug,
        author_name: form.author_name.value.trim(),
        email:       form.email?.value.trim() || null,
        body:        form.body.value.trim(),
        parent_id:   parentId || null,
        depth:       depth,
      };

      const { data, error } = await getDB().from('questions').insert(row).select().single();
      if (error) {
        btn.disabled = false;
        btn.textContent = parentId ? 'Reply' : 'Post';
        showError(form, 'Failed to post. Please try again.');
        return;
      }
      form.reset();
      onSuccess({ ...data, children: [] });
    });

    return form;
  }

  /* ── Small error helper ──────────────────────────── */
  function showError(form, msg) {
    let el = form.querySelector('.qa-error');
    if (!el) { el = document.createElement('p'); el.className = 'qa-error'; form.prepend(el); }
    el.textContent = msg;
  }

  /* ── HTML escape ─────────────────────────────────── */
  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Fetch all rows for a team and render ─────────── */
  async function loadThreads(slug, listEl) {
    listEl.innerHTML = '<p class="qa-loading">Loading…</p>';
    const { data, error } = await getDB()
      .from('questions')
      .select('*')
      .eq('team_slug', slug)
      .order('created_at', { ascending: true });

    listEl.innerHTML = '';
    if (error) { listEl.innerHTML = '<p class="qa-error">Could not load discussions.</p>'; return; }
    if (!data.length) { listEl.innerHTML = '<p class="qa-empty">No posts yet. Be the first!</p>'; return; }
    renderForest(buildTree(data), listEl, slug);
  }

  /* ── FAB drag (pointer-capture, same pattern as PiP) */
  function initDrag(fab) {
    let isDragging = false, dragOffX = 0, dragOffY = 0, startX = 0, startY = 0;
    const DRAG_THRESHOLD = 8; // px — dead zone to distinguish tap from drag

    function pinTopLeft() {
      if (fab.style.left && fab.style.left !== 'auto') return;
      const pr = fab.offsetParent.getBoundingClientRect();
      const r  = fab.getBoundingClientRect();
      fab.style.left   = (r.left - pr.left) + 'px';
      fab.style.top    = (r.top  - pr.top)  + 'px';
      fab.style.right  = 'auto';
      fab.style.bottom = 'auto';
    }

    fab.addEventListener('pointerdown', e => {
      pinTopLeft();
      fab.setPointerCapture(e.pointerId);
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      const pr = fab.offsetParent.getBoundingClientRect();
      dragOffX = e.clientX - pr.left - parseFloat(fab.style.left);
      dragOffY = e.clientY - pr.top  - parseFloat(fab.style.top);
      e.preventDefault();
    });

    fab.addEventListener('pointermove', e => {
      if (!fab.hasPointerCapture(e.pointerId)) return;
      // Only start dragging once pointer leaves the dead zone
      if (!isDragging &&
          Math.abs(e.clientX - startX) < DRAG_THRESHOLD &&
          Math.abs(e.clientY - startY) < DRAG_THRESHOLD) return;
      isDragging = true;
      const pr = fab.offsetParent.getBoundingClientRect();
      const pw = fab.offsetWidth, ph = fab.offsetHeight;
      fab.style.left = Math.max(0, Math.min(pr.width  - pw, e.clientX - pr.left - dragOffX)) + 'px';
      fab.style.top  = Math.max(0, Math.min(pr.height - ph, e.clientY - pr.top  - dragOffY)) + 'px';
    });

    fab.addEventListener('pointerup', () => { /* isDragging read in click handler, then reset */ });
    fab.addEventListener('pointercancel', () => { isDragging = false; });

    // Returns true only if the pointer moved beyond the dead zone
    return () => isDragging;
  }

  /* ── Main init ───────────────────────────────────── */
  window.initQA = function (slug, teamName) {
    const fab   = document.querySelector('.qa-fab');
    const panel = document.querySelector('.qa-panel');
    const list  = document.querySelector('.qa-list');
    const closeBtn = document.querySelector('.qa-close');
    const topForm  = document.querySelector('.qa-form--top');
    if (!fab || !panel || !list) return;

    let loaded = false;

    const wasDrag = initDrag(fab);

    fab.addEventListener('click', () => {
      if (wasDrag()) return; // suppress click after drag
      const opening = panel.hidden;
      panel.hidden = !opening;
      fab.classList.toggle('qa-open', opening);

      if (opening && !loaded) {
        loaded = true;
        loadThreads(slug, list);
      }
    });

    closeBtn?.addEventListener('click', () => {
      panel.hidden = true;
      fab.classList.remove('qa-open');
    });

    // Top-level post form
    if (topForm) {
      topForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = topForm.querySelector('.qa-submit');
        btn.disabled = true;
        btn.textContent = 'Posting…';

        const row = {
          team_slug:   slug,
          author_name: topForm.author_name.value.trim(),
          email:       topForm.email?.value.trim() || null,
          body:        topForm.body.value.trim(),
          parent_id:   null,
          depth:       0,
        };

        const { data, error } = await getDB().from('questions').insert(row).select().single();
        btn.disabled = false;
        btn.textContent = 'Post';
        if (error) { showError(topForm, 'Failed to post. Please try again.'); return; }

        const emptyMsg = list.querySelector('.qa-empty');
        if (emptyMsg) emptyMsg.remove();

        list.appendChild(renderNode({ ...data, children: [] }, slug));
        topForm.reset();
      });
    }
  };
})();
