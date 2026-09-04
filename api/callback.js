// Recibe el codigo de GitHub, lo cambia por un token y se lo pasa a Decap CMS
export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenRes.json();
    const token = data.access_token;

    const content = token
      ? { token, provider: "github" }
      : { error: "No se pudo obtener el token" };
    const status = token ? "success" : "error";

    // Decap espera recibir el resultado por postMessage desde esta ventana
    res.setHeader("Content-Type", "text/html");
    res.end(`<!DOCTYPE html><html><body><script>
      (function () {
        function send(msg) {
          window.opener && window.opener.postMessage(msg, "*");
        }
        window.addEventListener("message", function () {
          send('authorization:github:${status}:${JSON.stringify(content)}');
        }, { once: true });
        send("authorizing:github");
      })();
    </script><p>Conectando con GitHub…</p></body></html>`);
  } catch (e) {
    res.statusCode = 500;
    res.end("Error en la autenticación: " + e.message);
  }
}
