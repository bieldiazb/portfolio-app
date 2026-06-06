// netlify/functions/yahoo-proxy.js

export default async (request, context) => {
  const url = new URL(request.url)

  // context.params.path conté el path capturat pel wildcard `:path*`
  // Ex: /yahoo/v8/finance/chart/AAPL -> path = 'v8/finance/chart/AAPL'
  const captured = context.params?.path || ''
  const yahooPath = '/' + captured
  const query = url.search

  const fetchHeaders = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':          'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer':         'https://finance.yahoo.com/',
    'Origin':          'https://finance.yahoo.com',
  }

  const targets = [
    `https://query1.finance.yahoo.com${yahooPath}${query}`,
    `https://query2.finance.yahoo.com${yahooPath}${query}`,
  ]

  for (const target of targets) {
    try {
      const res = await fetch(target, {
        headers: fetchHeaders,
        signal:  AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const text = await res.text()
        return new Response(text, {
          status: 200,
          headers: {
            'Content-Type':                'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control':               'public, max-age=60',
          },
        })
      }
    } catch {}
  }

  return new Response(JSON.stringify({ error: 'Yahoo Finance no disponible' }), {
    status: 503,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export const config = {
  path: ['/yahoo/:path*', '/yahoo2/:path*', '/yahoo-search/:path*'],
}