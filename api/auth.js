// Inicia el login con GitHub para el panel /admin
export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const host = req.headers.host;
  const redirectUri = `https://${host}/api/callback`;

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo,user` +
    `&state=${Math.random().toString(36).substring(2)}`;

  res.writeHead(302, { Location: url });
  res.end();
}
