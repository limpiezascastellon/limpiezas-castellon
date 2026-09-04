// Devuelve y actualiza las solicitudes de presupuesto. Protegido por contraseña.
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const clave = process.env.ADMIN_PASSWORD;
  const enviada = req.headers["x-admin-key"] || req.query.key;

  if (!clave || enviada !== clave) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Marcar una solicitud como gestionada / nueva, o borrarla
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, accion } = body || {};
      if (!id) return res.status(400).json({ error: "Falta el id" });

      if (accion === "borrar") {
        await kv.del("presupuesto:" + id);
        await kv.lrem("presupuestos:lista", 0, id);
        return res.status(200).json({ ok: true });
      }

      const sol = await kv.get("presupuesto:" + id);
      if (sol) {
        sol.estado = accion === "gestionada" ? "gestionada" : "nueva";
        await kv.set("presupuesto:" + id, sol);
      }
      return res.status(200).json({ ok: true });
    }

    // GET: devolver todas las solicitudes (más recientes primero)
    const ids = (await kv.lrange("presupuestos:lista", 0, -1)) || [];
    const solicitudes = [];
    for (const id of ids) {
      const sol = await kv.get("presupuesto:" + id);
      if (sol) solicitudes.push(sol);
    }
    return res.status(200).json({ solicitudes });
  } catch (e) {
    return res.status(500).json({ error: "Error: " + e.message });
  }
}
