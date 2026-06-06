// netlify/functions/yahoo-proxy.js

export default async (request, context) => {
  // Amb `config.path`, Netlify passa el path capturat a context.params[0]
  // Ex: /yahoo/v8/finance/chart/AAPL?interval=1d -> params[0] = '/v8/finance/chart/AAPL'
  const captured = context.params?.['0'] || ''
  const url       = new URL(request.url)
  const query     = url.search

  // Si no tenim el path capturat, intentem llegir-lo del header com a fallback
  let yahooPath = captured
  if (!yahooPath) {
    const forwarded = request.headers.get('x-forwarded-path') || ''
    yahooPath = forwarded.replace(/^\/(yahoo2|yahoo-search|yahoo)/, '')
  }

  if (!yahooPath) {
    return new Response(JSON.stringify({ error: 'Path no disponible' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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

// Captura el path sencer després del prefix com a paràmetre
export const config = {
  path: ['/yahoo/:0*', '/yahoo2/:0*', '/yahoo-search/:0*'],
}