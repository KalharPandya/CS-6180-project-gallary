/**
 * Cloudflare Worker — Proxy for vancouver.northeastern.edu
 *
 * Why this exists:
 *   Metasteps (Unity WebView) cannot render vancouver.northeastern.edu directly.
 *   This worker fetches it server-side, strips frame-blocking / CSP headers,
 *   rewrites all relative URLs to absolute, and returns a WebView-safe response.
 *
 * Deploy:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this file's contents into the editor
 *   3. Click "Deploy" — you get a URL like https://nu-vancouver.<you>.workers.dev
 *   4. Point Metasteps (or wherever) at that URL instead of the real NU site
 *
 * Supports all paths:
 *   https://nu-vancouver.<you>.workers.dev/about → proxies vancouver.northeastern.edu/about
 *   https://nu-vancouver.<you>.workers.dev/      → proxies the homepage
 */

const TARGET_ORIGIN = 'https://vancouver.northeastern.edu';

// Spoofed UA — Unity WebViews often get blocked by UA sniffing; this pretends to be Chrome Mobile
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

// Headers to strip from the upstream response (prevent frame/embed blocking)
const STRIP_RESPONSE_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
]);

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    // Build the upstream URL: same path + query, different origin
    const upstreamUrl = TARGET_ORIGIN + incoming.pathname + incoming.search;

    // Forward the request with a real browser UA
    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: {
        'User-Agent': MOBILE_UA,
        Accept:
          request.headers.get('Accept') ||
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity', // ask for uncompressed so we can read & rewrite body
      },
      redirect: 'follow',
    });

    let upstreamRes;
    try {
      upstreamRes = await fetch(upstreamRequest);
    } catch (err) {
      return new Response(`Proxy error: could not reach ${TARGET_ORIGIN}\n${err}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // For HTML: read, rewrite relative URLs, then re-serve
    // For everything else (CSS, JS, images): stream through as-is
    let responseBody;
    if (isHtml) {
      let html = await upstreamRes.text();

      // Rewrite root-relative URLs → absolute (covers href, src, action, srcset)
      html = html
        // href="/path" and src="/path"
        .replace(/(href|src|action)="(\/(?!\/)[^"]*?)"/gi, `$1="${TARGET_ORIGIN}$2"`)
        .replace(/(href|src|action)='(\/(?!\/)[^']*?)'/gi, `$1='${TARGET_ORIGIN}$2'`)
        // srcset may have comma-separated entries like "/img/foo.png 2x"
        .replace(/srcset="([^"]*)"/gi, (_, set) =>
          `srcset="${rewriteSrcset(set, TARGET_ORIGIN)}"`)
        // url() in inline styles
        .replace(/url\(["']?(\/(?!\/)[^"')]+)["']?\)/gi, `url(${TARGET_ORIGIN}$1)`);

      responseBody = html;
    } else {
      responseBody = upstreamRes.body;
    }

    // Build clean response headers
    const newHeaders = new Headers();
    for (const [key, value] of upstreamRes.headers.entries()) {
      if (STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
      newHeaders.set(key, value);
    }
    // Allow embedding from any origin (needed for iframes inside WebView pages)
    newHeaders.set('Access-Control-Allow-Origin', '*');
    // Remove content-encoding since we decoded the body above
    if (isHtml) newHeaders.delete('content-encoding');

    return new Response(responseBody, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: newHeaders,
    });
  },
};

/**
 * Rewrite root-relative entries inside a srcset string.
 * e.g. "/img/hero.png 1x, /img/hero@2x.png 2x" → "https://... 1x, https://... 2x"
 */
function rewriteSrcset(srcset, origin) {
  return srcset
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      if (parts[0] && parts[0].startsWith('/') && !parts[0].startsWith('//')) {
        parts[0] = origin + parts[0];
      }
      return parts.join(' ');
    })
    .join(', ');
}
