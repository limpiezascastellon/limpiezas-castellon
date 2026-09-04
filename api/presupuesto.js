// Recibe los datos del formulario de presupuesto y los guarda en Vercel KV
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // Permitir el envío desde el navegador
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { nombre, telefono, email, servicio, mensaje, web } = body || {};

    // Trampa antispam: si el campo oculto "web" viene relleno, es un bot
    if (web) return res.status(200).json({ ok: true });

    if (!nombre || (!telefono && !email)) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const id = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const solicitud = {
      id,
      nombre: String(nombre).slice(0, 120),
      telefono: String(telefono || "").slice(0, 40),
      email: String(email || "").slice(0, 120),
      servicio: String(servicio || "").slice(0, 80),
      mensaje: String(mensaje || "").slice(0, 2000),
      fecha: new Date().toISOString(),
      estado: "nueva",
    };

    // Guardar la solicitud y añadir su id a la lista ordenada por fecha
    await kv.set("presupuesto:" + id, solicitud);
    await kv.lpush("presupuestos:lista", id);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Error al guardar: " + e.message });
  }
}
