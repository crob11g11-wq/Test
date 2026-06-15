// Cloudflare Worker — ICA API proxy
// Deploy this at workers.cloudflare.com (free account, takes ~2 mins)
// It forwards requests to handla.api.ica.se and adds CORS headers so
// the meal planner can call ICA's API from the browser.

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, AuthenticationTicket, Content-Type',
          'Access-Control-Expose-Headers': 'AuthenticationTicket, SessionTicket, LogoutKey',
        },
      });
    }

    const url = new URL(request.url);
    const target = 'https://handla.api.ica.se' + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.delete('origin');
    headers.delete('host');

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Expose-Headers', 'AuthenticationTicket, SessionTicket, LogoutKey');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
