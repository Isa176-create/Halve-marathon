// Vercel Serverless Function: /api/strava/token
// Wisselt een Strava auth code in voor een access token.
// De Client Secret staat ALLEEN hier, nooit in de browser.

export default async function handler(req, res) {
  // Sta alleen POST requests toe
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Strava environment variables not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Strava token error:', data);
      return res.status(response.status).json({ error: data.message || 'Strava error' });
    }

    // Stuur alleen de benodigde data terug (NIET de client_secret)
    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete: {
        id: data.athlete.id,
        firstname: data.athlete.firstname,
        lastname: data.athlete.lastname,
        profile: data.athlete.profile,
      },
    });
  } catch (error) {
    console.error('Token exchange failed:', error);
    return res.status(500).json({ error: 'Token exchange failed' });
  }
}
