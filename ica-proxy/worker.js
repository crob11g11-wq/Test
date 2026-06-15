// Cloudflare Worker — ICA API proxy
// Deploy this at workers.cloudflare.com (free account, takes ~2 mins)

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, AuthenticationTicket, Content-Type, X-ICA-User, X-ICA-Pass',
          'Access-Control-Expose-Headers': 'AuthenticationTicket, SessionTicket, LogoutKey',
        },
      });
    }

    const url = new URL(request.url);
    const target = 'https://handla.api.ica.se' + url.pathname + url.search;

    const headers = new Headers(request.headers);

    // Cloudflare strips Authorization on inbound requests — reconstruct it
    // from custom headers if provided
    const icaUser = headers.get('X-ICA-User');
    const icaPass = headers.get('X-ICA-Pass');
    if (icaUser && icaPass) {
      headers.set('Authorization', 'Basic ' + btoa(`${icaUser}:${icaPass}`));
    }

    headers.delete('X-ICA-User');
    headers.delete('X-ICA-Pass');
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
