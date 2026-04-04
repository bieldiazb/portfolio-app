// netlify/functions/alphavantage.js
// Proxy per Alpha Vantage — injecta ALPHA_VANTAGE_KEY al servidor
//
// SETUP:
// 1. Clau gratuïta: https://www.alphavantage.co/support/#api-key
// 2. Netlify → Environment variables → ALPHA_VANTAGE_KEY = la_teva_clau
// 3. netlify.toml: /av → /.netlify/functions/alphavantage

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }

  const apiKey = process.env.ALPHA_VANTAGE_KEY
  if (!apiKey) return {
    statusCode: 500, headers: cors,
    body: JSON.stringify({ error: 'ALPHA_VANTAGE_KEY no configurada' }),
  }

  try {
    // Tots els params de la crida original + apikey
    const qs = new URLSearchParams(event.queryStringParameters || {})
    qs.set('apikey', apiKey)

    const url = `https://www.alphavantage.co/query?${qs.toString()}`
    console.log('[AV] function:', qs.get('function'), qs.get('symbol'))

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