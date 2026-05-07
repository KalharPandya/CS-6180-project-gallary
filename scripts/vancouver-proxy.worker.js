// Cloudflare Worker -- Proxy for vancouver.northeastern.edu
// Deploy: Workers & Pages -> Create Worker -> paste this -> Deploy
// Then point Metasteps at: https://<worker-name>.<you>.workers.dev

var TARGET = 'https://vancouver.northeastern.edu';

var MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

var STRIP_HEADERS = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
];

export default {
  async fetch(request) {
    var incoming = new URL(request.url);
    var upstreamUrl = TARGET + incoming.pathname + incoming.search;

    var upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: {
        'User-Agent': MOBILE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });

    var upstreamRes;
    try {
      upstreamRes = await fetch(upstreamRequest);
    } catch (err) {
      return new Response('Proxy error: ' + err, {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    var contentType = upstreamRes.headers.get('content-type') || '';
    var isHtml = contentType.indexOf('text/html') !== -1;

    var responseBody;
    if (isHtml) {
      var html = await upstreamRes.text();

      // Rewrite root-relative hrefs to absolute
      html = html.replace(/href="(\/[^"]*)"/g, 'href="' + TARGET + '$1"');
      html = html.replace(/href='(\/[^']*)'/g, "href='" + TARGET + "$1'");

      // Rewrite root-relative srcs to absolute
      html = html.replace(/src="(\/[^"]*)"/g, 'src="' + TARGET + '$1"');
      html = html.replace(/src='(\/[^']*)'/g, "src='" + TARGET + "$1'");

      // Rewrite root-relative action attributes
      html = html.replace(/action="(\/[^"]*)"/g, 'action="' + TARGET + '$1"');

      responseBody = html;
    } else {
      responseBody = upstreamRes.body;
    }

    var newHeaders = new Headers();
    for (var pair of upstreamRes.headers.entries()) {
      var key = pair[0].toLowerCase();
      var skip = false;
      for (var i = 0; i < STRIP_HEADERS.length; i++) {
        if (key === STRIP_HEADERS[i]) { skip = true; break; }
      }
      if (!skip) {
        newHeaders.set(pair[0], pair[1]);
      }
    }

    newHeaders.set('Access-Control-Allow-Origin', '*');
    if (isHtml) {
      newHeaders.delete('content-encoding');
    }

    return new Response(responseBody, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: newHeaders,
    });
  },
};
