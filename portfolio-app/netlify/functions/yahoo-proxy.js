// netlify/functions/yahoo-proxy.js
// Gestiona /yahoo/* i /yahoo2/* afegint User-Agent per evitar el bloqueig de Yahoo

export default async (request, context) => {
  const url = new URL(request.url)

  // El path arriba com /.netlify/functions/yahoo-proxy?path=/v8/finance/chart/AAPL&...
  // Però Netlify envia el path original a través de context.params o url.pathname
  // Recuperem el path original del header x-original-url o del referrer
  
  // Netlify passa el path original com a part del pathname
  // /yahoo/v8/finance/chart/AAPL -> /.netlify/functions/yahoo-proxy (path perdut)
  // Necessitem llegir-lo del header 'x-forwarded-path' o 'x-nf-request-id'
  
  // La manera correcta: Netlify envia el path original via headers
  const originalPath = request.headers.get('x-forwarded-path') || 
                       request.headers.get('x-original-url') ||
                       url.pathname

  // Determina quin prefix tenia (yahoo, yahoo2, yahoo-search)
  let yahooPath = originalPath
    .replace(/^\/(yahoo2|yahoo-search|yahoo)/, '')
  
  const yahooQuery = url.search

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  }

  const targets = [
    `https://query1.finance.yahoo.com${yahooPath}${yahooQuery}`,
    `https://query2.finance.yahoo.com${yahooPath}${yahooQuery}`,
  ]

  for (const target of targets) {
    try {
      const res = await fetch(target, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const text = await res.text()
        return new Response(text, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60',
          },
        })
      }
    } catch {}
  }

  return new Response(JSON.stringify({ error: 'Yahoo Finance no disponible' }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export const config = { path: ['/yahoo/*', '/yahoo2/*', '/yahoo-search/*'] }