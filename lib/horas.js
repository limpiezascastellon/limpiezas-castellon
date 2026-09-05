// ============================================================================
//  NÚCLEO DEL CONTROL DE HORAS  ·  Limpiezas Castellón
//  ---------------------------------------------------------------------------
//  Todo lo que tocan la base de datos lo hacen desde aquí, tanto el panel
//  (api/fichajes.js) como el bot de WhatsApp (api/whatsapp.js). Así los dos
//  guardan exactamente igual y no pueden separarse con el tiempo.
// ============================================================================
import { createClient } from "@vercel/kv";
import crypto from "node:crypto";

export const TZ = "Europe/Madrid";
export const MESES_VISIBLES_EMPLEADA = 3;

/* ---------------------------------------------------------------------------
   CONEXIÓN CON LA BASE DE DATOS
   Vercel la llama KV_REST_API_* y Upstash la llama UPSTASH_REDIS_REST_*.
   Aceptamos las dos para que funcione se conecte como se conecte.
   --------------------------------------------------------------------------- */
const BD_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_API_URL || "";
const BD_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_API_TOKEN || "";

export const kv = (BD_URL && BD_TOKEN) ? createClient({ url: BD_URL, token: BD_TOKEN }) : null;

export const AVISO_SIN_BD =
  "La base de datos no está conectada. En Vercel, abre el proyecto → pestaña Storage → " +
  "conecta una base de datos Redis (Upstash) y vuelve a desplegar.";

/* ===========================================================================
   FECHAS Y HORAS (siempre en hora de España)
   =========================================================================== */
export function ahoraMadrid() {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
  return { fecha: s.slice(0, 10), hora: s.slice(11, 16) };
}

export const esFecha = (f) => typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f);
export const esHora  = (h) => typeof h === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);

// Si la salida es anterior a la entrada se entiende que el turno cruza la medianoche
export function minutosEntre(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);
  let min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min < 0) min += 1440;
  return min;
}

export const mesDe = (fecha) => fecha.slice(0, 7);

export function sumaMeses(fecha, n) {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
export function sumaDias(fecha, n) {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function mesesEntre(desde, hasta) {
  const out = [];
  let d = new Date(desde.slice(0, 7) + "-01T12:00:00Z");
  const fin = new Date(hasta.slice(0, 7) + "-01T12:00:00Z");
  let guarda = 0;
  while (d <= fin && guarda++ < 240) {
    out.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

// La empleada trabaja por meses completos, así que el límite es el día 1 del
// mes más antiguo que puede ver, no una fecha a mitad de mes. Con 3 meses y
// estando en septiembre, puede tocar julio, agosto y septiembre enteros.
// Se parte siempre del día 1 para que no haya desbordes con los meses de 31.
export const limiteEmpleada = () => {
  const d = new Date(ahoraMadrid().fecha.slice(0, 7) + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - (MESES_VISIBLES_EMPLEADA - 1));
  return d.toISOString().slice(0, 10);
};

export const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function nombreDia(fecha) { return DIAS_ES[new Date(fecha + "T12:00:00Z").getUTCDay()]; }
export function esFinDeSemana(fecha) {
  const d = new Date(fecha + "T12:00:00Z").getUTCDay();
  return d === 0 || d === 6;
}
export function fechaLarga(fecha) {
  const d = new Date(fecha + "T12:00:00Z");
  return nombreDia(fecha) + " " + d.getUTCDate() + " de " + MESES_ES[d.getUTCMonth()];
}
export function horasTexto(min) {
  min = Math.round(min || 0);
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return h + " h " + m + " min";
  if (h) return h + " h";
  return m + " min";
}

/* ===========================================================================
   AYUDAS GENERALES
   =========================================================================== */
export const nuevoId = (p) => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const txt = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

export const num = (v) => {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

export async function mgetSeguro(claves) {
  if (!claves.length) return [];
  const out = [];
  for (let i = 0; i < claves.length; i += 90) {
    const trozo = claves.slice(i, i + 90);
    try {
      const r = await kv.mget(...trozo);
      out.push(...(r || []));
    } catch {
      for (const c of trozo) out.push(await kv.get(c));
    }
  }
  return out;
}

/* ===========================================================================
   CONTRASEÑAS
   =========================================================================== */
export function hashPass(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 32).toString("hex");
}
export function comprobarPass(pass, emp) {
  if (!emp || !emp.salt || !emp.hash) return false;
  const calc = Buffer.from(hashPass(pass, emp.salt), "hex");
  const guardado = Buffer.from(emp.hash, "hex");
  return calc.length === guardado.length && crypto.timingSafeEqual(calc, guardado);
}
export const nuevaSal = () => crypto.randomBytes(16).toString("hex");

/* ===========================================================================
   TELÉFONOS
   Guardamos siempre en formato internacional sin signos: 34600111222
   =========================================================================== */
export function normalizarTelefono(tel) {
  let t = String(tel || "").replace(/[^\d+]/g, "");
  if (t.startsWith("+")) t = t.slice(1);
  if (t.startsWith("00")) t = t.slice(2);
  // Número español escrito sin prefijo (9 dígitos que empiezan por 6, 7, 8 o 9)
  if (/^[6789]\d{8}$/.test(t)) t = "34" + t;
  return /^\d{8,15}$/.test(t) ? t : "";
}

export async function empleadaPorTelefono(tel) {
  const t = normalizarTelefono(tel);
  if (!t) return null;
  const id = await kv.get("wa:tel:" + t);
  return id ? await kv.get("emp:" + id) : null;
}

// Mantiene el índice teléfono → empleada al guardar o borrar una empleada
export async function indexarTelefono(emp, telefonoAnterior) {
  const viejo = normalizarTelefono(telefonoAnterior);
  const nuevo = normalizarTelefono(emp && emp.telefono);
  if (viejo && viejo !== nuevo) {
    await kv.del("wa:tel:" + viejo);
    await kv.del("wa:v:" + viejo);      // deja de estar vinculado a WhatsApp
    await kv.del("wa:s:" + viejo);
  }
  if (nuevo && emp) await kv.set("wa:tel:" + nuevo, emp.id);
}

/* ===========================================================================
   LECTURA DE EMPLEADAS, CLIENTES Y REGISTROS
   =========================================================================== */
export async function listaEmpleadas() {
  const ids = (await kv.smembers("fich:emps")) || [];
  const emps = (await mgetSeguro(ids.map((i) => "emp:" + i))).filter(Boolean);
  return emps.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
}

export async function listaClientes() {
  const ids = (await kv.smembers("fich:clis")) || [];
  const clis = (await mgetSeguro(ids.map((i) => "cli:" + i))).filter(Boolean);
  return clis.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
}

// Clientes activos asignados a una empleada
export async function clientesDe(emp) {
  const todos = await listaClientes();
  return todos.filter((c) => c.activo !== false && (emp.clientes || []).includes(c.id));
}

export async function registrosEntre(desde, hasta, filtro = {}) {
  const meses = mesesEntre(desde, hasta);
  let ids = [];
  for (const m of meses) {
    const r = (await kv.smembers("fich:mes:" + m)) || [];
    ids = ids.concat(r);
  }
  ids = [...new Set(ids)];
  let regs = (await mgetSeguro(ids.map((i) => "fic:" + i))).filter(Boolean);
  regs = regs.filter((r) => r.fecha >= desde && r.fecha <= hasta);
  if (filtro.empId) regs = regs.filter((r) => r.empId === filtro.empId);
  if (filtro.cliId) regs = regs.filter((r) => r.cliId === filtro.cliId);
  return regs.sort((a, b) =>
    a.fecha === b.fecha ? (a.entrada || "").localeCompare(b.entrada || "") : b.fecha.localeCompare(a.fecha)
  );
}

// Añade a cada registro los datos calculados que necesitan las pantallas
export function decorar(r) {
  const minutos = r.minutos || 0;
  const precio = r.precioHora || 0;
  return {
    ...r,
    diaSemana: nombreDia(r.fecha),
    finDeSemana: esFinDeSemana(r.fecha),
    horas: Math.round((minutos / 60) * 100) / 100,
    importe: Math.round((minutos / 60) * precio * 100) / 100,
  };
}

// La empleada ve sus horas, no el precio que se cobra al cliente
export function quitarPrecio(r) {
  const { precioHora, importe, ...resto } = r;
  return resto;
}

/* ===========================================================================
   ESCRITURA DE REGISTROS
   =========================================================================== */
export async function guardarRegistro(reg) {
  await kv.set("fic:" + reg.id, reg);
  await kv.sadd("fich:mes:" + mesDe(reg.fecha), reg.id);
  await kv.sadd("fich:emp:" + reg.empId, reg.id);
}

export async function borrarRegistro(reg) {
  await kv.del("fic:" + reg.id);
  await kv.srem("fich:mes:" + mesDe(reg.fecha), reg.id);
  await kv.srem("fich:emp:" + reg.empId, reg.id);
}

/* ---------------------------------------------------------------------------
   Alta de horas por parte de una empleada, con todas las validaciones.
   Lo usan igual el panel y el bot de WhatsApp.
   Devuelve { ok, creados, duplicados } o { ok:false, error }
   --------------------------------------------------------------------------- */
export async function apuntarHoras(emp, lineas) {
  const hoy = ahoraMadrid();
  const limite = limiteEmpleada();

  if (!Array.isArray(lineas) || !lineas.length) return { ok: false, error: "No hay nada que apuntar." };
  if (lineas.length > 60) return { ok: false, error: "Demasiadas líneas de una vez." };

  // Se valida todo antes de guardar nada: o entra el lote entero o no entra nada
  const preparadas = [];
  for (const l of lineas) {
    const cliId = txt(l.cliId, 40);
    const fecha = txt(l.fecha, 10);
    const entrada = txt(l.entrada, 5);
    const salida = txt(l.salida, 5);
    if (!(emp.clientes || []).includes(cliId)) return { ok: false, error: "Ese cliente no está asignado a ti." };
    if (!esFecha(fecha) || !esHora(entrada) || !esHora(salida)) return { ok: false, error: "Revisa el día y las horas." };
    if (fecha > hoy.fecha) return { ok: false, error: "No puedes apuntar días que aún no han llegado." };
    if (fecha < limite) return { ok: false, error: "Solo puedes apuntar días de los últimos 3 meses." };
    if (minutosEntre(entrada, salida) === 0) {
      return { ok: false, error: "La hora de entrada y la de salida no pueden ser la misma." };
    }
    preparadas.push({ cliId, fecha, entrada, salida, notas: txt(l.notas, 300), origen: l.origen });
  }

  // No repetir lo que ya está apuntado (evita duplicados al pulsar dos veces)
  const fechas = preparadas.map((l) => l.fecha);
  const yaHay = await registrosEntre(
    fechas.reduce((a, b) => (a < b ? a : b)),
    fechas.reduce((a, b) => (a > b ? a : b)),
    { empId: emp.id }
  );
  const huella = (l) => l.fecha + "|" + l.cliId + "|" + l.entrada + "|" + l.salida;
  const existentes = new Set(yaHay.map(huella));

  const creados = [];
  let duplicados = 0;
  for (const l of preparadas) {
    if (existentes.has(huella(l))) { duplicados++; continue; }
    existentes.add(huella(l));
    const cli = await kv.get("cli:" + l.cliId);
    const reg = {
      id: nuevoId("fic"),
      empId: emp.id,
      empNombre: emp.nombre,
      cliId: l.cliId,
      cliNombre: cli ? cli.nombre : "",
      fecha: l.fecha,
      entrada: l.entrada,
      salida: l.salida,
      minutos: minutosEntre(l.entrada, l.salida),
      precioHora: cli ? (cli.precioHora || 0) : 0,
      notas: l.notas,
      validado: false,
      creadoPor: l.origen || "empleada",
      creado: new Date().toISOString(),
    };
    await guardarRegistro(reg);
    creados.push(decorar(reg));
  }
  return { ok: true, creados, duplicados };
}
