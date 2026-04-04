// netlify/functions/fmp.js
// Proxy per Financial Modeling Prep API
// Injecta FMP_API_KEY des de les variables d'entorn de Netlify

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'FMP_API_KEY no configurada a Netlify Environment Variables' }),
    }
  }

  try {
    // Extreu el path FMP des de múltiples fonts (compatibilitat)
    // event.rawPath: /fmp/v3/historical-price-full/stock_dividend/LMT
    // event.path:    /.netlify/functions/fmp/v3/...  (o sense el /v3)
    // event.queryStringParameters.path: si el client envia ?path=/v3/...

    let fmpPath = ''

    // Opció 1: path explícit via query string (més fiable)
    if (event.queryStringParameters?.path) {
      fmpPath = event.queryStringParameters.path
    }
    // Opció 2: rawPath (Netlify Functions v2)
    else if (event.rawPath) {
      fmpPath = event.rawPath
        .replace(/^\/\.netlify\/functions\/fmp/, '')
        .replace(/^\/fmp/, '')
    }
    // Opció 3: path clàssic
    else if (event.path) {
      fmpPath = event.path
        .replace(/^\/\.netlify\/functions\/fmp/, '')
        .replace(/^\/fmp/, '')
    }

    if (!fmpPath || fmpPath === '/') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Path buit',
          debug: { rawPath: event.rawPath, path: event.path, qs: event.queryStringParameters }
        }),
      }
    }

    // Construïm la URL de FMP (sense el paràmetre "path" que és intern)
    const qs = new URLSearchParams(event.queryStringParameters || {})
    qs.delete('path')  // treiem el paràmetre intern
    qs.set('apikey', apiKey)

    const fmpUrl = `https://financialmodelingprep.com/api${fmpPath}?${qs.toString()}`
    console.log('[FMP]', fmpPath)

    const res = await fetch(fmpUrl, {
      headers: { 'User-Agent': 'Cartera-App/1.0' }
    })

    const body = await res.text()

    return {
      statusCode: res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800',
      },
      body,
    }
  } catch (err) {
    console.error('[FMP] Error:', err.message)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    }
  }
}