// netlify/functions/claude.js
// Middleware que afegeix la clau API d'Anthropic sense exposar-la al client.
//
// SETUP:
// 1. Copia aquest fitxer a netlify/functions/claude.js al teu projecte
// 2. A Netlify Dashboard → Site settings → Environment variables → afegeix:
//    ANTHROPIC_API_KEY = sk-ant-...
// 3. El netlify.toml ja té el redirect /claude/* → /.netlify/functions/claude

exports.handler = async (event) => {
  // Només acceptem POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type, anthropic-version',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY no configurada a Netlify' } }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    return {
      statusCode: res.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { message: err.message } }),
    }
  }
}