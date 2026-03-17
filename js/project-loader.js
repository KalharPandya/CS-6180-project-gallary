(() => {
  const content = document.getElementById('content');
  if (!content) return;

  // If the template's <main> already has real content (custom HTML mode), do nothing.
  if (content.children.length > 0 || content.textContent.trim().length > 0) return;

  // Derive the base URL for this team folder from the current page URL.
  // Handles: /teams/team-alpha/, /teams/team-alpha, /teams/team-alpha/index.html
  let pathname = window.location.pathname;
  if (pathname.endsWith('/index.html')) {
    pathname = pathname.slice(0, -'index.html'.length);
  } else if (!pathname.endsWith('/')) {
    pathname = pathname + '/';
  }
  const baseUrl = window.location.origin + pathname;
  const readmeUrl = baseUrl + 'README.md';

  function wrapIframes() {
    content.querySelectorAll('iframe').forEach(iframe => {
      if (iframe.parentElement.classList.contains('video-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'video-wrapper';
      iframe.replaceWith(wrapper);
      wrapper.appendChild(iframe);
    });
  }

  function rewriteRelativePaths() {
    // Rewrite img src and anchor href that are relative (not http/https/data/# prefixed)
    content.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !/^(https?:|data:|\/|#)/.test(src)) {
        img.src = baseUrl + src;
      }
    });
    content.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !/^(https?:|mailto:|\/|#)/.test(href)) {
        a.href = baseUrl + href;
      }
    });
    content.querySelectorAll('video source[src]').forEach(src => {
      const s = src.getAttribute('src');
      if (s && !/^(https?:|data:|\/|#)/.test(s)) {
        src.src = baseUrl + s;
      }
    });
  }

  content.innerHTML = '<p class="loading">Loading&hellip;</p>';

  // Wait for marked + DOMPurify to be available (they load with defer)
  function waitForLibs(cb) {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      cb();
    } else {
      setTimeout(() => waitForLibs(cb), 50);
    }
  }

  waitForLibs(() => {
    fetch(readmeUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(md => {
        const rawHtml = marked.parse(md);
        const clean = DOMPurify.sanitize(rawHtml, {
          ADD_TAGS: ['iframe'],
          ADD_ATTR: ['allowfullscreen', 'frameborder', 'src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop']
        });
        content.innerHTML = clean;
        rewriteRelativePaths();
        wrapIframes();

        // Update page title from first H1 if present
        const h1 = content.querySelector('h1');
        if (h1) {
          document.title = `${h1.textContent} — CS-6180`;
        }
      })
      .catch(() => {
        content.innerHTML = `
          <div class="error">
            <h2>Content coming soon</h2>
            <p>This team's project page is not yet available.</p>
          </div>`;
      });
  });
})();
