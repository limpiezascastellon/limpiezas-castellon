// ============================================================================
//  API DE FICHAJES  ·  Limpiezas Castellón
//  ---------------------------------------------------------------------------
//  Un único endpoint que gestiona todo el sistema de control horario:
//   · Empleadas: entran con usuario/contraseña y registran entrada y salida.
//   · Administrador: crea empleadas y clientes, asigna clientes, ve y edita
//     todos los registros, pone precio/hora y exporta.
//
//  REGLA IMPORTANTE: la empleada solo puede ver y tocar sus registros de los
//  últimos 3 meses. Los más antiguos desaparecen de su panel pero NUNCA se
//  borran: el administrador los sigue viendo todos.
// ============================================================================
import crypto from "node:crypto";
import {
  kv, AVISO_SIN_BD,
  ahoraMadrid, esFecha, esHora, minutosEntre, mesDe, sumaMeses, limiteEmpleada,
  nuevoId, txt, num, comprobarPass, hashPass, nuevaSal,
  normalizarTelefono, indexarTelefono,
  listaEmpleadas, listaClientes, registrosEntre, decorar, quitarPrecio,
  guardarRegistro, borrarRegistro, apuntarHoras,
} from "../lib/horas.js";

const DIAS_SESION = 30;   // la empleada no tiene que entrar cada día

/* ===========================================================================
   SESIONES DEL PANEL DE LA EMPLEADA
   =========================================================================== */
async function crearSesion(empId) {
  const token = crypto.randomBytes(24).toString("hex");
  await kv.set("sesion:" + token, { empId, creada: Date.now() }, { ex: DIAS_SESION * 86400 });
  return token;
}

async function empleadaDeToken(req) {
  const token = req.headers["x-emp-token"] || (req.query && req.query.token) || "";
  if (!token) return null;
  const s = await kv.get("sesion:" + token);
  if (!s || !s.empId) return null;
  const emp = await kv.get("emp:" + s.empId);
  if (!emp || emp.activa === false) return null;
  await kv.expire("sesion:" + token, DIAS_SESION * 86400).catch(() => {});
  return emp;
}

function esAdmin(req) {
  const clave = process.env.ADMIN_PASSWORD;
  const enviada = req.headers["x-admin-key"] || (req.query && req.query.key);
  return Boolean(clave) && enviada === clave;
}

/* ===========================================================================
   HANDLER PRINCIPAL
   ---------------------------------------------------------------------------
   Estas son las únicas acciones que puede hacer una empleada con su token.
   Todo lo demás exige la contraseña de administrador.
   =========================================================================== */
const ACCIONES_EMPLEADA = [
  "sesion", "mios",
  "emp-crear", "emp-editar", "emp-borrar", "emp-clave",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
  const accion = (req.query && req.query.accion) || body.accion || "";

  // Sin base de datos no se puede hacer nada: mejor decirlo claro que fallar por dentro
  if (!kv) return res.status(503).json({ error: AVISO_SIN_BD });

  try {
    /* ---------- ZONA PÚBLICA: entrar al panel de la empleada ---------- */
    if (accion === "login") return await login(body, res);

    /* ---------- ZONA EMPLEADA ---------- */
    if (ACCIONES_EMPLEADA.includes(accion)) {
      const emp = await empleadaDeToken(req);
      if (!emp) return res.status(401).json({ error: "Sesión caducada. Vuelve a entrar." });
      return await zonaEmpleada(accion, body, emp, res);
    }

    /* ---------- ZONA ADMINISTRADOR ---------- */
    if (!esAdmin(req)) return res.status(401).json({ error: "No autorizado" });
    return await zonaAdmin(accion, body, req, res);
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor: " + e.message });
  }
}

function safeJSON(s) { try { return JSON.parse(s); } catch { return {}; } }

/* ===========================================================================
   LOGIN DE LA EMPLEADA
   =========================================================================== */
async function login(body, res) {
  const usuario = txt(body.usuario, 60).toLowerCase();
  const pass = String(body.pass || "");
  if (!usuario || !pass) return res.status(400).json({ error: "Escribe tu usuario y tu contraseña." });

  // Freno sencillo contra intentos repetidos
  const claveFallos = "fich:fallos:" + usuario;
  const fallos = (await kv.get(claveFallos)) || 0;
  if (fallos >= 10) {
    return res.status(429).json({ error: "Demasiados intentos. Espera 15 minutos o avisa a la oficina." });
  }

  const empId = await kv.get("emp:usuario:" + usuario);
  const emp = empId ? await kv.get("emp:" + empId) : null;

  if (!emp || !comprobarPass(pass, emp)) {
    await kv.set(claveFallos, fallos + 1, { ex: 900 });
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }
  if (emp.activa === false) return res.status(403).json({ error: "Tu acceso está desactivado. Avisa a la oficina." });

  await kv.del(claveFallos);
  const token = await crearSesion(emp.id);
  return res.status(200).json({ token, ...(await datosEmpleada(emp)) });
}

// Todo lo que necesita el panel de la empleada al abrirse
async function datosEmpleada(emp) {
  const clientes = (await listaClientes()).filter(
    (c) => c.activo !== false && (emp.clientes || []).includes(c.id)
  );
  return {
    empleada: { id: emp.id, nombre: emp.nombre, usuario: emp.usuario },
    clientes: clientes.map((c) => ({ id: c.id, nombre: c.nombre, direccion: c.direccion || "" })),
    limite: limiteEmpleada(),
    hoy: ahoraMadrid(),
  };
}

/* ===========================================================================
   ACCIONES DE LA EMPLEADA
   =========================================================================== */
async function zonaEmpleada(accion, body, emp, res) {
  const hoy = ahoraMadrid();
  const limite = limiteEmpleada();

  if (accion === "sesion") return res.status(200).json(await datosEmpleada(emp));

  /* --- Mis horas de los últimos 3 meses --- */
  if (accion === "mios") {
    const desde = body.desde && esFecha(body.desde) && body.desde > limite ? body.desde : limite;
    const hasta = body.hasta && esFecha(body.hasta) ? body.hasta : hoy.fecha;
    const regs = await registrosEntre(desde, hasta, { empId: emp.id });
    return res.status(200).json({
      registros: regs.map(decorar).map(quitarPrecio),
      limite,
      hoy,
    });
  }

  /* --- Apuntar horas: uno o varios días de golpe --- */
  if (accion === "emp-crear") {
    // Admite una sola línea o un lote (para rellenar varios días a la vez
    // o copiar la semana anterior de una sentada).
    const lineas = Array.isArray(body.lineas) && body.lineas.length
      ? body.lineas
      : [{ cliId: body.cliId, fecha: body.fecha, entrada: body.entrada, salida: body.salida, notas: body.notas }];

    const r = await apuntarHoras(emp, lineas);
    if (!r.ok) return res.status(400).json({ error: r.error });
    return res.status(200).json({
      ok: true,
      creados: r.creados.map(quitarPrecio),
      duplicados: r.duplicados,
    });
  }

  /* --- Corregir un turno propio --- */
  if (accion === "emp-editar") {
    const reg = await kv.get("fic:" + txt(body.id, 40));
    if (!reg || reg.empId !== emp.id) return res.status(404).json({ error: "Registro no encontrado." });
    if (reg.fecha < limite) return res.status(403).json({ error: "Ese día ya no está disponible en tu panel." });
    if (reg.validado) return res.status(403).json({ error: "La oficina ya ha revisado ese día. Avísales si hay un error." });
    const entrada = txt(body.entrada, 5), salida = txt(body.salida, 5);
    if (!esHora(entrada) || !esHora(salida)) return res.status(400).json({ error: "Revisa las horas." });
    reg.entrada = entrada;
    reg.salida = salida;
    reg.minutos = minutosEntre(entrada, salida);
    if (body.notas !== undefined) reg.notas = txt(body.notas, 300);
    reg.editado = new Date().toISOString();
    await guardarRegistro(reg);
    return res.status(200).json({ ok: true, registro: quitarPrecio(decorar(reg)) });
  }

  /* --- Borrar un turno propio --- */
  if (accion === "emp-borrar") {
    const reg = await kv.get("fic:" + txt(body.id, 40));
    if (!reg || reg.empId !== emp.id) return res.status(404).json({ error: "Registro no encontrado." });
    if (reg.fecha < limite) return res.status(403).json({ error: "Ese día ya no está disponible en tu panel." });
    if (reg.validado) return res.status(403).json({ error: "La oficina ya ha revisado ese día. Avísales si hay un error." });
    await borrarRegistro(reg);
    return res.status(200).json({ ok: true });
  }

  /* --- Cambiar su propia contraseña --- */
  if (accion === "emp-clave") {
    const actual = String(body.actual || ""), nueva = String(body.nueva || "");
    if (!comprobarPass(actual, emp)) return res.status(401).json({ error: "La contraseña actual no es correcta." });
    if (nueva.length < 6) return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
    emp.salt = nuevaSal();
    emp.hash = hashPass(nueva, emp.salt);
    await kv.set("emp:" + emp.id, emp);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Acción no reconocida." });
}

/* ===========================================================================
   ACCIONES DEL ADMINISTRADOR
   =========================================================================== */
async function zonaAdmin(accion, body, req, res) {
  const hoy = ahoraMadrid();

  /* --- Empleadas y clientes de una sola vez --- */
  if (accion === "admin-datos") {
    const emps = await listaEmpleadas();
    const limpias = [];
    for (const e of emps) {
      const { salt, hash, ...resto } = e;
      resto.waVinculado = e.telefono ? Boolean(await kv.get("wa:v:" + e.telefono)) : false;
      limpias.push(resto);
    }
    return res.status(200).json({
      empleadas: limpias,
      clientes: await listaClientes(),
      hoy,
    });
  }

  /* --- Crear o actualizar una empleada --- */
  if (accion === "emp-guardar" || accion === "admin-emp-guardar") {
    const nombre = txt(body.nombre, 80);
    const usuario = txt(body.usuario, 40).toLowerCase().replace(/\s+/g, "");
    if (!nombre || !usuario) return res.status(400).json({ error: "El nombre y el usuario son obligatorios." });
    if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) {
      return res.status(400).json({ error: "El usuario solo puede tener letras, números, puntos, guiones y guiones bajos (mínimo 3)." });
    }

    let emp;
    if (body.id) {
      emp = await kv.get("emp:" + txt(body.id, 40));
      if (!emp) return res.status(404).json({ error: "Empleada no encontrada." });
      if (emp.usuario !== usuario) {
        const ocupado = await kv.get("emp:usuario:" + usuario);
        if (ocupado && ocupado !== emp.id) return res.status(400).json({ error: "Ese usuario ya está en uso." });
        await kv.del("emp:usuario:" + emp.usuario);
      }
    } else {
      const ocupado = await kv.get("emp:usuario:" + usuario);
      if (ocupado) return res.status(400).json({ error: "Ese usuario ya está en uso." });
      if (!body.pass || String(body.pass).length < 6) {
        return res.status(400).json({ error: "Ponle una contraseña de al menos 6 caracteres." });
      }
      emp = { id: nuevoId("emp"), creada: new Date().toISOString(), clientes: [] };
    }

    emp.nombre = nombre;
    emp.usuario = usuario;
    emp.activa = body.activa !== false;
    const telefonoAnterior = emp.telefono || "";
    emp.telefono = normalizarTelefono(body.telefono);
    emp.clientes = Array.isArray(body.clientes) ? body.clientes.map((c) => txt(c, 40)).filter(Boolean) : (emp.clientes || []);
    if (body.pass) {
      if (String(body.pass).length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
      emp.salt = nuevaSal();
      emp.hash = hashPass(String(body.pass), emp.salt);
      emp.claveCambiada = new Date().toISOString();
    }

    await kv.set("emp:" + emp.id, emp);
    await kv.set("emp:usuario:" + usuario, emp.id);
    await kv.sadd("fich:emps", emp.id);
    await indexarTelefono(emp, telefonoAnterior);
    const { salt, hash, ...limpia } = emp;
    return res.status(200).json({ ok: true, empleada: limpia });
  }

  /* --- Borrar una empleada (sus fichajes se conservan) --- */
  if (accion === "emp-eliminar") {
    const emp = await kv.get("emp:" + txt(body.id, 40));
    if (!emp) return res.status(404).json({ error: "Empleada no encontrada." });
    await indexarTelefono(null, emp.telefono);
    await kv.del("emp:" + emp.id);
    await kv.del("emp:usuario:" + emp.usuario);
    await kv.srem("fich:emps", emp.id);
    return res.status(200).json({ ok: true });
  }

  /* --- Crear o actualizar un cliente --- */
  if (accion === "cli-guardar") {
    const nombre = txt(body.nombre, 100);
    if (!nombre) return res.status(400).json({ error: "El nombre del cliente es obligatorio." });
    let cli;
    if (body.id) {
      cli = await kv.get("cli:" + txt(body.id, 40));
      if (!cli) return res.status(404).json({ error: "Cliente no encontrado." });
    } else {
      cli = { id: nuevoId("cli"), creado: new Date().toISOString() };
    }
    cli.nombre = nombre;
    cli.direccion = txt(body.direccion, 160);
    cli.precioHora = num(body.precioHora);
    cli.activo = body.activo !== false;
    cli.notas = txt(body.notas, 300);
    await kv.set("cli:" + cli.id, cli);
    await kv.sadd("fich:clis", cli.id);
    return res.status(200).json({ ok: true, cliente: cli });
  }

  /* --- Borrar un cliente (sus fichajes se conservan) --- */
  if (accion === "cli-eliminar") {
    const id = txt(body.id, 40);
    await kv.del("cli:" + id);
    await kv.srem("fich:clis", id);
    return res.status(200).json({ ok: true });
  }

  /* --- Asignar clientes a una empleada --- */
  if (accion === "asignar") {
    const emp = await kv.get("emp:" + txt(body.empId, 40));
    if (!emp) return res.status(404).json({ error: "Empleada no encontrada." });
    emp.clientes = Array.isArray(body.clientes) ? body.clientes.map((c) => txt(c, 40)).filter(Boolean) : [];
    await kv.set("emp:" + emp.id, emp);
    return res.status(200).json({ ok: true, clientes: emp.clientes });
  }

  /* --- Desvincular WhatsApp: la próxima vez volverá a pedir la contraseña --- */
  if (accion === "wa-desvincular") {
    const emp = await kv.get("emp:" + txt(body.id, 40));
    if (!emp) return res.status(404).json({ error: "Empleada no encontrada." });
    if (emp.telefono) {
      await kv.del("wa:v:" + emp.telefono);
      await kv.del("wa:s:" + emp.telefono);
    }
    return res.status(200).json({ ok: true });
  }

  /* --- Ver todos los fichajes de un periodo --- */
  if (accion === "admin-fichajes") {
    const desde = esFecha(body.desde) ? body.desde : sumaMeses(hoy.fecha, -1);
    const hasta = esFecha(body.hasta) ? body.hasta : hoy.fecha;
    const regs = await registrosEntre(desde, hasta, {
      empId: txt(body.empId, 40) || null,
      cliId: txt(body.cliId, 40) || null,
    });
    return res.status(200).json({ registros: regs.map(decorar), desde, hasta, hoy });
  }

  /* --- Crear o corregir cualquier fichaje --- */
  if (accion === "fic-guardar") {
    const fecha = txt(body.fecha, 10);
    const entrada = txt(body.entrada, 5);
    const salida = txt(body.salida, 5);
    if (!esFecha(fecha) || !esHora(entrada) || !esHora(salida)) {
      return res.status(400).json({ error: "Revisa la fecha y las horas." });
    }
    let reg;
    if (body.id) {
      reg = await kv.get("fic:" + txt(body.id, 40));
      if (!reg) return res.status(404).json({ error: "Registro no encontrado." });
      if (mesDe(reg.fecha) !== mesDe(fecha)) {
        await kv.srem("fich:mes:" + mesDe(reg.fecha), reg.id);
      }
    } else {
      reg = { id: nuevoId("fic"), creado: new Date().toISOString(), creadoPor: "admin" };
    }

    const empId = txt(body.empId, 40) || reg.empId;
    const cliId = txt(body.cliId, 40) || reg.cliId;
    const emp = await kv.get("emp:" + empId);
    const cli = await kv.get("cli:" + cliId);
    if (!empId || !cliId) return res.status(400).json({ error: "Elige empleada y cliente." });

    if (reg.empId && reg.empId !== empId) await kv.srem("fich:emp:" + reg.empId, reg.id);

    reg.empId = empId;
    reg.empNombre = emp ? emp.nombre : (reg.empNombre || "");
    reg.cliId = cliId;
    reg.cliNombre = cli ? cli.nombre : (reg.cliNombre || "");
    reg.fecha = fecha;
    reg.entrada = entrada;
    reg.salida = salida;
    reg.minutos = minutosEntre(entrada, salida);
    reg.precioHora = body.precioHora !== undefined ? num(body.precioHora) : (reg.precioHora || (cli ? cli.precioHora : 0) || 0);
    reg.notas = body.notas !== undefined ? txt(body.notas, 300) : (reg.notas || "");
    if (body.validado !== undefined) reg.validado = Boolean(body.validado);
    reg.editado = new Date().toISOString();

    await guardarRegistro(reg);
    return res.status(200).json({ ok: true, registro: decorar(reg) });
  }

  /* --- Cambiar solo el precio/hora de uno o varios registros --- */
  if (accion === "fic-precio") {
    const ids = Array.isArray(body.ids) ? body.ids : [txt(body.id, 40)];
    const precio = num(body.precioHora);
    const cambiados = [];
    for (const id of ids.filter(Boolean)) {
      const reg = await kv.get("fic:" + txt(id, 40));
      if (!reg) continue;
      reg.precioHora = precio;
      reg.editado = new Date().toISOString();
      await kv.set("fic:" + reg.id, reg);
      cambiados.push(decorar(reg));
    }
    return res.status(200).json({ ok: true, registros: cambiados });
  }

  /* --- Marcar como revisado (bloquea la edición por parte de la empleada) --- */
  if (accion === "fic-validar") {
    const ids = Array.isArray(body.ids) ? body.ids : [txt(body.id, 40)];
    const valor = body.validado !== false;
    for (const id of ids.filter(Boolean)) {
      const reg = await kv.get("fic:" + txt(id, 40));
      if (!reg) continue;
      reg.validado = valor;
      await kv.set("fic:" + reg.id, reg);
    }
    return res.status(200).json({ ok: true });
  }

  /* --- Borrar un fichaje --- */
  if (accion === "fic-eliminar") {
    const reg = await kv.get("fic:" + txt(body.id, 40));
    if (!reg) return res.status(404).json({ error: "Registro no encontrado." });
    await borrarRegistro(reg);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Acción no reconocida." });
}
