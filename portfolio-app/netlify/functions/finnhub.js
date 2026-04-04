// netlify/functions/finnhub.js
// Proxy per Finnhub — injecta FINNHUB_API_KEY al servidor
// Clau gratuïta: https://finnhub.io/register (60 crides/minut)
// Netlify env var: FINNHUB_API_KEY

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) return {
    statusCode: 500, headers: cors,
    body: JSON.stringify({ error: 'FINNHUB_API_KEY no configurada a Netlify' }),
  }

  try {
    // event.queryStringParameters conté tots els params (path, symbol, from, to, etc.)
    const qs = new URLSearchParams(event.queryStringParameters || {})
    // El path Finnhub ve com a param ?path=/stock/dividend
    const path = qs.get('path') || '/stock/dividend'
    qs.delete('path')
    qs.set('token', apiKey)

    const url = `https://finnhub.io/api/v1${path}?${qs.toString()}`
    console.log('[Finnhub]', path, qs.get('symbol') || '')

    const res  = await fetch(url, { headers: { 'User-Agent': 'Cartera-App/1.0' } })
    const body = await res.text()

    return {
      statusCode: res.status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      body,
    }
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) }
  }
}