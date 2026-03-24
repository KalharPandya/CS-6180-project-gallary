(() => {
  /* ── SVG play icon ───────────────────────────────── */
  const PLAY_SVG = `
    <svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="44" cy="44" r="42" fill="rgba(0,0,0,0.52)" stroke="rgba(255,255,255,0.85)" stroke-width="2.5"/>
      <polygon points="35,26 67,44 35,62" fill="#fff"/>
    </svg>`;

  /* ── Poster element helper ───────────────────────── */
  function posterTag(url, cls) {
    if (!url) return `<img class="${cls}">`;
    const isImg = /\.(png|jpe?g|webp|gif)$/i.test(url);
    return isImg
      ? `<img class="${cls}" src="${url}" alt="Poster">`
      : `<embed class="${cls}" type="application/pdf" src="${url}#view=Fit&toolbar=0">`;
  }

  /* ── Build HTML ──────────────────────────────────── */
  function buildHTML(team, posterUrl, videoUrl) {
    const hasBoth = !!(posterUrl && videoUrl);
    return `
    <div class="viewer-page">
      <div class="viewer-header">
        <a class="viewer-back" href="../../index.html">&#8592; Gallery</a>
        <img class="viewer-nu-logo" src="../../assets/logos/nu-logo-white.png" alt="Northeastern University">
        <span class="viewer-title">${team.name} &mdash; ${team.title}</span>
        <div class="viewer-controls">
          <button class="viewer-tab" data-mode="poster" ${!posterUrl?'disabled':''} title="Poster [P]">&#128196; Poster</button>
          <button class="viewer-tab" data-mode="video"  ${!videoUrl ?'disabled':''} title="Video [V]">&#127902; Video</button>
        </div>
      </div>

      <div class="viewer-body">

        <!-- ─ Main viewer area ─ -->
        <div class="viewer-main">

          <div class="viewer-panel viewer-panel--poster">
            ${posterTag(posterUrl, 'viewer-pdf')}
          </div>

          <div class="viewer-panel viewer-panel--video">
            <div class="video-wrap">
              <video class="viewer-video" playsinline src="${videoUrl || ''}"></video>
              <div class="video-play-overlay">
                <button class="video-play-btn" aria-label="Play / Pause">${PLAY_SVG}</button>
              </div>
            </div>
          </div>

        </div><!-- /viewer-main -->

        <!-- ─ PiP: draggable + resizable ─ -->
        <div class="viewer-pip" ${hasBoth ? '' : 'hidden'}>
          <div class="viewer-pip-dragbar" title="Drag to reposition">
            <button class="viewer-pip-maximize" title="Expand PiP">&#x2922;</button>
            <div class="pip-drag-zone"></div>
            <button class="viewer-pip-swap" title="Swap main &harr; PiP">&#x21C4;</button>
          </div>
          <div class="viewer-pip-inner">
            ${posterTag(posterUrl, 'viewer-pip-pdf')}
            <div class="video-wrap pip-video-wrap">
              <video class="viewer-pip-video" playsinline src="${videoUrl || ''}"></video>
              <div class="video-play-overlay pip-play-overlay">
                <button class="video-play-btn pip-play-btn" aria-label="Play / Pause">${PLAY_SVG}</button>
              </div>
            </div>
          </div>
          <div class="viewer-pip-resize" title="Drag to resize"></div>
        </div>

      </div><!-- /viewer-body -->
    </div>`;
  }

  /* ── Mode ───────────────────────────────────────── */
  function applyMode(mode, S) {
    S.mode = mode;
    const { bodyEl, pipEl, tabBtns } = S;

    bodyEl.className = `viewer-body mode-${mode}`;

    // Pause whichever video is about to be hidden
    const mainVid = document.querySelector('.viewer-video');
    const pipVid  = document.querySelector('.viewer-pip-video');
    if (mode === 'poster' || mode === 'default') mainVid?.pause();
    if (mode === 'video'  || mode === 'swapped') pipVid?.pause();

    // PiP: visible in default (video) + poster (video) + swapped (pdf)
    if (pipEl) {
      pipEl.hidden = !['default', 'poster', 'swapped'].includes(mode);
    }

    tabBtns.forEach(b => {
      b.classList.toggle('active',
        b.dataset.mode === mode ||
        (mode === 'default' && b.dataset.mode === 'poster') ||
        (mode === 'swapped' && b.dataset.mode === 'video'));
    });
  }

  /* ── PiP: draggable + resizable + maximize ──────── */
  function initPip(S) {
    const pip = S.pipEl;
    if (!pip) return;

    const dragbar   = pip.querySelector('.pip-drag-zone');
    const resizeHdl = pip.querySelector('.viewer-pip-resize');
    const maxBtn    = pip.querySelector('.viewer-pip-maximize');

    let dragOffX = 0, dragOffY = 0;
    let resizeStartX = 0, resizeStartW = 0;

    // Convert bottom/right → top/left using parent-relative coords (fixes jump on click)
    function pinTopLeft() {
      if (pip.style.left && pip.style.left !== 'auto') return;
      const pr = pip.offsetParent.getBoundingClientRect();
      const r  = pip.getBoundingClientRect();
      pip.style.left   = (r.left - pr.left) + 'px';
      pip.style.top    = (r.top  - pr.top)  + 'px';
      pip.style.right  = 'auto';
      pip.style.bottom = 'auto';
    }

    // ─ Drag ─
    dragbar.addEventListener('pointerdown', e => {
      pinTopLeft();
      dragbar.setPointerCapture(e.pointerId);
      pip.classList.add('pip-dragging');
      const pr = pip.offsetParent.getBoundingClientRect();
      dragOffX = e.clientX - pr.left - parseFloat(pip.style.left);
      dragOffY = e.clientY - pr.top  - parseFloat(pip.style.top);
      e.preventDefault();
    });
    dragbar.addEventListener('pointermove', e => {
      if (!dragbar.hasPointerCapture(e.pointerId)) return;
      const pr = pip.offsetParent.getBoundingClientRect();
      const pw = pip.offsetWidth, ph = pip.offsetHeight;
      pip.style.left = Math.max(0, Math.min(pr.width  - pw, e.clientX - pr.left - dragOffX)) + 'px';
      pip.style.top  = Math.max(0, Math.min(pr.height - ph, e.clientY - pr.top  - dragOffY)) + 'px';
    });
    dragbar.addEventListener('pointerup',     () => pip.classList.remove('pip-dragging'));
    dragbar.addEventListener('pointercancel', () => pip.classList.remove('pip-dragging'));

    // ─ Resize ─
    resizeHdl.addEventListener('pointerdown', e => {
      pinTopLeft();
      resizeHdl.setPointerCapture(e.pointerId);
      resizeStartX = e.clientX;
      resizeStartW = pip.offsetWidth;
      e.stopPropagation();
      e.preventDefault();
    });
    resizeHdl.addEventListener('pointermove', e => {
      if (!resizeHdl.hasPointerCapture(e.pointerId)) return;
      const w = Math.max(160, Math.min(window.innerWidth * 0.65, resizeStartW + (e.clientX - resizeStartX)));
      pip.style.width = w + 'px';
    });

    // ─ Maximize toggle ─
    maxBtn?.addEventListener('click', e => {
      e.stopPropagation();
      pip.classList.toggle('pip-expanded');
      const expanded = pip.classList.contains('pip-expanded');
      maxBtn.textContent = expanded ? '\u229F' : '\u2922';
      maxBtn.title       = expanded ? 'Collapse PiP' : 'Expand PiP';
      pip.style.width = '';
    });
  }

  /* ── Custom play buttons ────────────────────────── */
  function initPlayButtons() {
    document.querySelectorAll('.video-wrap').forEach(wrap => {
      const video   = wrap.querySelector('video');
      const overlay = wrap.querySelector('.video-play-overlay');
      if (!video || !overlay) return;

      const sync = () => overlay.classList.toggle('v-playing', !video.paused);

      wrap.querySelector('.video-play-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        video.paused ? video.play() : video.pause();
      });

      video.addEventListener('click',      () => video.paused ? video.play() : video.pause());
      video.addEventListener('play',       sync);
      video.addEventListener('pause',      sync);
      video.addEventListener('ended',      sync);
      video.addEventListener('loadeddata', sync);

      if (!wrap.classList.contains('pip-video-wrap')) {
        video.addEventListener('dblclick', () => toggleFS(video));
      }
    });
  }

  /* ── Fullscreen ─────────────────────────────────── */
  function toggleFS(el) {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)?.call(el);
    }
  }

  /* ── Keyboard ───────────────────────────────────── */
  function initKeyboard(S) {
    document.addEventListener('keydown', e => {
      if (e.target.matches('input,textarea,select')) return;
      switch (e.key) {
        case 'p': case 'P': if (S.posterUrl) applyMode('poster', S); break;
        case 'v': case 'V': if (S.videoUrl)  applyMode('video',  S); break;
        case 'ArrowRight': cycleMode( 1, S); break;
        case 'ArrowLeft':  cycleMode(-1, S); break;
        case ' ': {
          e.preventDefault();
          const vid = document.querySelector('.viewer-video,.viewer-pip-video');
          if (vid) vid.paused ? vid.play() : vid.pause();
          break;
        }
        case 'f': case 'F': {
          const v = document.querySelector('.viewer-video');
          if (v && getComputedStyle(v).display !== 'none') toggleFS(v);
          break;
        }
      }
    });
  }

  const CYCLE = ['poster', 'video'];
  function cycleMode(dir, S) {
    const avail = CYCLE.filter(m =>
      (m === 'poster' && S.posterUrl) ||
      (m === 'video'  && S.videoUrl));
    const cur = (S.mode === 'default' || S.mode === 'swapped') ? 'poster' : S.mode;
    const i = avail.indexOf(cur);
    applyMode(avail[(i + dir + avail.length) % avail.length], S);
  }

  /* ── Touch: swipe + pinch ───────────────────────── */
  function initTouch(S) {
    const page = document.querySelector('.viewer-page');
    let t0 = null, lastTap = 0, pinch0 = null, zoomEl = null, zoomBase = 1;

    page.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, ts: Date.now() };
        const now = Date.now();
        if (now - lastTap < 280) {
          const v = document.querySelector('.viewer-video');
          if (v && getComputedStyle(v).display !== 'none') toggleFS(v);
        }
        lastTap = now;
      } else if (e.touches.length === 2) {
        e.preventDefault();
        pinch0   = pinchDist(e.touches);
        zoomEl   = S.bodyEl.querySelector('.viewer-pdf') ||
                   S.bodyEl.querySelector('.viewer-video');
        zoomBase = getScale(zoomEl);
      }
    }, { passive: false });

    page.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pinch0 && zoomEl) {
        e.preventDefault();
        setScale(zoomEl, Math.max(0.5, Math.min(5, zoomBase * pinchDist(e.touches) / pinch0)));
      }
    }, { passive: false });

    page.addEventListener('touchend', e => {
      if (e.changedTouches.length === 1 && t0 && e.touches.length === 0) {
        const dx = e.changedTouches[0].clientX - t0.x;
        const dy = e.changedTouches[0].clientY - t0.y;
        if (Date.now() - t0.ts < 400 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          cycleMode(dx < 0 ? 1 : -1, S);
        }
        t0 = null;
      }
      if (e.touches.length < 2) { pinch0 = null; zoomEl = null; }
    });

    let lastPinchEnd = 0;
    page.addEventListener('touchend', e => {
      if (e.touches.length === 0 && e.changedTouches.length === 2) {
        const now = Date.now();
        if (now - lastPinchEnd < 350 && zoomEl) resetScale(zoomEl);
        lastPinchEnd = now;
      }
    });
  }

  /* ── Ctrl+scroll zoom ───────────────────────────── */
  function initScrollZoom(S) {
    S.bodyEl.addEventListener('wheel', e => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const el = S.bodyEl.querySelector('.viewer-pdf') ||
                 S.bodyEl.querySelector('.viewer-video');
      if (!el) return;
      setScale(el, Math.max(0.5, Math.min(5, getScale(el) * (e.deltaY < 0 ? 1.1 : 0.9))));
    }, { passive: false });
  }

  /* ── Scale helpers ──────────────────────────────── */
  const pinchDist  = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
  const getScale   = el => parseFloat(el?.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
  const setScale   = (el, s) => { if (el) { el.style.transform = `scale(${s})`; el.style.transformOrigin = 'center center'; } };
  const resetScale = el => { if (el) { el.style.transform = ''; el.style.transformOrigin = ''; } };

  /* ── Main ───────────────────────────────────────── */
  fetch('./project.json')
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(team => {
      document.title = `${team.name} — ${team.title} | CS 6180`;

      const posterUrl = team.poster || null;
      const videoUrl  = team.video  || null;
      const hasBoth   = !!(posterUrl && videoUrl);

      document.body.innerHTML = buildHTML(team, posterUrl, videoUrl);

      const S = {
        mode:     'none',
        posterUrl, videoUrl, hasBoth,
        bodyEl:   document.querySelector('.viewer-body'),
        pipEl:    document.querySelector('.viewer-pip'),
        tabBtns:  document.querySelectorAll('.viewer-tab[data-mode]'),
      };

      applyMode(posterUrl && videoUrl ? 'default' : posterUrl ? 'poster' : 'video', S);

      S.tabBtns.forEach(b => b.addEventListener('click', () => applyMode(b.dataset.mode, S)));

      document.querySelector('.viewer-pip-swap')?.addEventListener('click', () =>
        applyMode(S.mode === 'default' ? 'swapped' : 'default', S));

      initPip(S);
      initPlayButtons();
      initKeyboard(S);
      initTouch(S);
      initScrollZoom(S);
    })
    .catch(() => {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100dvh;
             background:#000;color:#fff;font-family:sans-serif;flex-direction:column;gap:1rem">
          <p style="font-size:1.2rem">Project not found.</p>
          <a href="../../index.html" style="color:#C8102E">&#8592; Back to Gallery</a>
        </div>`;
    });
})();
