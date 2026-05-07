// VDEX'in Cloudflare korumasını aşmak için public proxy kullanıyoruz
// allorigins.win - ücretsiz public CORS proxy servisi

exports.handler = async (event) => {
  const path = event.queryStringParameters.path || '';
  const targetUrl = `https://api.vdex.trade/api-gateway/${path}`;

  // Public CORS proxy üzerinden istek
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });

    const text = await response.text();

    // HTML cevap geldiyse hata
    if (text.trim().startsWith('<')) {
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Proxy returned HTML',
          preview: text.substring(0, 200)
        })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON', preview: text.substring(0, 200) })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
