// netlify/functions/yahoo-proxy.js
// Proxy serverless per obtenir dades de Yahoo Finance sense problemes de CORS.
// Deploy automàtic amb Netlify — no cal cap configuració addicional.

export async function handler(event) {
  const ticker = event.queryStringParameters?.ticker
  if (!ticker) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ticker required' }) }
  }

  const now  = Math.floor(Date.now() / 1000)
  const from = now - 10 * 365 * 24 * 3600
  const url  = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${from}&period2=${now}&interval=1mo&events=history`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cartera/1.0)',
        'Accept': 'application/json',
      },
    })
    const data = await res.json()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400', // cache 24h
      },
      body: JSON.stringify(data),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}