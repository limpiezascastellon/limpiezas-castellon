# Control de horas — guía completa

Sistema para saber cuántas horas está cada empleada en cada cliente. Ellas rellenan su parte de horas cuando les viene bien, y tú lo ves todo, le pones precio y lo exportas a Excel.

Funciona sobre lo que ya tenías: la misma web, el mismo panel `/admin`, la misma base de datos y la misma contraseña de administrador. **No hay que contratar nada nuevo ni configurar variables nuevas.**

> **No es un sistema de fichaje con reloj.** Nadie tiene que estar pendiente de pulsar un botón al entrar y otro al salir. La empleada apunta el horario que hizo —día a día, al acabar la semana o a fin de mes— y el sistema calcula los totales.

---

## Qué se añade

| Dónde | Qué es |
|---|---|
| `tudominio.com/horas` | Parte de horas de las empleadas. Entran con su usuario y contraseña. |
| `/admin` → **Horas registradas** | Todas las horas, con precio/hora, importes y exportación a Excel. |
| `/admin` → **Empleadas** | Crear empleadas, darles contraseña y asignarles clientes. |
| `/admin` → **Clientes** | Crear clientes con su precio/hora. |

---

## Antes de nada: conectar la base de datos

El sistema guarda los datos en una base de datos Redis de Vercel. Si al entrar ves un error que menciona `KV_REST_API_URL`, es que no está conectada. Se hace una sola vez:

1. Entra en **vercel.com** y abre el proyecto de la web.
2. Pestaña **Storage** (arriba).
3. Botón **Create Database** o **Connect Database**.
4. Elige **Upstash · Redis** (aparece en el Marketplace de Vercel; Vercel KV, el antiguo, ya no está disponible).
5. Acepta las condiciones, ponle un nombre (por ejemplo `limpiezas-datos`), deja la región que sugiere y crea.
6. En el paso de conectar, marca los tres entornos: **Production, Preview y Development**.
7. Pestaña **Deployments** → en el último despliegue, menú de los tres puntos → **Redeploy**.

El plan gratuito sobra de largo para este uso. Con esto funcionan tanto el control de horas como los presupuestos, que usan la misma base de datos.

---

## Instalación (5 minutos, una sola vez)

Sube estos archivos a tu repositorio de GitHub. Vercel republica solo en un minuto.

**Archivos nuevos:**
- `api/fichajes.js`
- `horas.html`

**Archivos que se reemplazan:**
- `admin/index.html` (el panel, con los tres apartados nuevos)
- `eleventy.config.js` (dos líneas: publicar `horas.html` y no publicar este manual)

Si lo haces desde la web de GitHub: entra en tu repositorio → *Add file* → *Upload files* → arrastra los cuatro → *Commit changes*. Los que ya existían se sustituyen solos.

Cuando Vercel termine, entra en `tudominio.com/admin` con tu contraseña de siempre. Verás los tres apartados nuevos en el menú lateral, bajo el título **Control horario**.

---

## Primeros pasos, en este orden

**1. Crea los clientes.** Apartado *Clientes* → **Nuevo cliente**. Pon el nombre, la dirección y el precio por hora que le facturas. Ese precio se aplica solo a las horas nuevas que se apunten en ese cliente, y siempre lo puedes cambiar después línea a línea.

**2. Crea las empleadas.** Apartado *Empleadas* → **Nueva empleada**. Nombre, un usuario sencillo (`maria`, `ana.lopez`) y una contraseña de al menos 6 caracteres.

> **Apunta la contraseña antes de guardar.** Se guarda cifrada, así que ni tú ni nadie puede volver a leerla. Si se pierde, entras en *Editar* y le pones una nueva.

**3. Asígnale sus clientes.** En su ficha, botón **Asignar clientes**. Marca los sitios donde trabaja. Solo esos le aparecerán al apuntar horas.

**4. Dale la dirección.** Mándale por WhatsApp `tudominio.com/horas` con su usuario y contraseña. Que abra el enlace en el móvil y le dé a *Añadir a pantalla de inicio*: le quedará como si fuera una app.

---

## Por WhatsApp, si lo prefieres

Además del panel, las empleadas pueden apuntar sus horas escribiendo a un número de WhatsApp, con botones. Va contra la misma base de datos y con las mismas reglas. La puesta en marcha está en **[WHATSAPP.md](WHATSAPP.md)**.

---

## Cómo lo usa la empleada

Abre la página y ya está dentro (la sesión le dura un mes, no tiene que escribir la contraseña cada vez).

Funciona igual que la hoja de papel de toda la vida, pero sumando sola.

**Paso 1 — elige el cliente.** Le salen solo los que tú le hayas asignado, en botones grandes. Si únicamente tiene uno, este paso se salta y entra directa. La próxima vez que abra, el panel recuerda el último cliente que usó.

**Paso 2 — la hoja del mes.** Le aparece el mes entero, del 1 al 31, en una sola columna: día, entrada/salida y horas. Los sábados y domingos van en color distinto, el día de hoy lleva una marca verde, y los días que aún no han llegado salen apagados y no se pueden tocar. Con las flechas de arriba se mueve entre meses.

**Paso 3 — toca un día y pon las horas.** Se abre una ventanita con entrada y salida. Mientras las escribe ya ve el cálculo: *"4 h 30 min"*. Guarda y el día queda relleno en la hoja.

Abajo del todo, igual que en el papel: **TOTAL HORAS** del mes para ese cliente.

Detalles que importan:

- **Turnos de noche.** De 23:00 a 03:00 cuenta 4 horas, no da un número negativo. El día se apunta en la fecha en la que *empieza* el turno, igual que se hace en papel.
- **Varios tramos el mismo día.** Si un día trabajó dos veces en el mismo sitio, el segundo tramo aparece debajo, indentado, y se puede tocar por separado.
- **No se duplica.** Si pulsa dos veces sin querer, el sistema detecta lo repetido y no lo guarda otra vez.
- **Borrar pide confirmación.** Hay que pulsar dos veces, para que un dedo torpe no se lleve un día por delante.
- **Días revisados.** Si ya has marcado un día como revisado, a ella le sale con un candado y no lo puede cambiar.

En la pestaña *Resumen del mes* tiene el total del mes con **todos los clientes juntos** y el desglose día a día.

La empleada **no ve precios ni importes**, solo sus horas.

---

## Cómo lo usas tú

En *Horas registradas* tienes filtros por fechas, empleada, cliente y tipo de día. Arriba hay atajos: **este mes**, **mes pasado**, **esta semana**, **todo el año**.

La tabla trae, en cada línea: fecha, día de la semana, empleada, cliente, entrada, salida, horas, precio/hora, importe y estado. **Los fines de semana salen resaltados en amarillo** y con su etiqueta, y arriba tienes un recuadro con el total de horas trabajadas en fin de semana.

- **Cambiar el precio de una línea:** escribe directamente en la casilla de la columna *Precio/h*. El importe se recalcula al momento.
- **Revisar:** al marcar una línea como revisada, la empleada ya no puede modificarla. Es lo que conviene hacer al cerrar el mes. Si necesitas reabrirla, pulsa *Reabrir*.
- **Añadir horas a mano:** para meter horas de una empleada tú mismo.
- **Editar / Borrar:** cualquier línea, sin límite de antigüedad.

### Exportar a Excel

Botón **Exportar a Excel**. Sale un archivo con tres hojas:

1. **Detalle** — una fila por apunte, con día de la semana y una columna *Fin de semana* con Sí/No, horas en decimal, precio/hora e importe.
2. **Por empleada** — apuntes, horas, horas en fin de semana e importe de cada una.
3. **Por cliente** — lo mismo agrupado por cliente, listo para facturar.

Se exporta exactamente lo que estás viendo con los filtros puestos. Si filtras "solo fines de semana" y el mes pasado, eso es lo que sale.

---

## Pensado para el móvil

El panel de las empleadas está hecho para usarse con una mano y con el pulgar: botones grandes, teclados numéricos al tocar las horas, la ventana de apuntar horas sube desde abajo como en cualquier app, y ningún campo hace que la pantalla se acerque sola al tocarlo.

**Tu panel de administración también funciona en el móvil.** En pantalla estrecha, la tabla de horas se convierte en tarjetas —una por apunte, con su precio editable y sus botones— así no tienes que arrastrar la pantalla a los lados para leerla. Los filtros se apilan y los atajos de periodo se deslizan. En ordenador sigues viendo la tabla completa de siempre.

Diles a las empleadas que abran `tudominio.com/horas` en el móvil y le den a **Añadir a pantalla de inicio**: les quedará un icono como el de cualquier aplicación.

---

## La regla de los tres meses

- La empleada **solo ve y solo puede tocar los últimos tres meses**, y son meses completos: estando en septiembre puede rellenar julio, agosto y septiembre enteros. Lo anterior desaparece de su panel, y tampoco puede apuntar horas en fechas más antiguas.
- Tú **lo sigues viendo todo, para siempre**. Nada se borra.
- Esto no es solo un filtro de pantalla: el servidor rechaza cualquier intento de leer o modificar registros más antiguos aunque se manipule la página.

Si borras a una empleada o a un cliente, **sus horas se conservan** en el historial con su nombre. Lo que se borra es el acceso, no los datos.

> Ten en cuenta que la normativa española de registro de jornada obliga a conservar los registros durante cuatro años y a tenerlos disponibles para la Inspección de Trabajo. Por eso el sistema no borra nada por su cuenta. Consulta con tu asesoría laboral cómo encaja esto con vuestro convenio y si necesitáis algo más.

---

## Seguridad

- Las contraseñas se guardan cifradas (scrypt con sal). Ni siquiera desde la base de datos se pueden leer.
- Cada empleada solo puede consultar y modificar **sus propios registros**, y solo en clientes que le hayas asignado.
- No se pueden apuntar días que aún no han llegado.
- Tras 10 intentos fallidos de entrar con el mismo usuario, ese usuario se bloquea 15 minutos.
- Tu contraseña de administrador es la de siempre (la variable `ADMIN_PASSWORD` en Vercel).

---

## Problemas frecuentes

**"La base de datos no está conectada"** → falta el paso de arriba: Vercel → Storage → conectar Redis (Upstash) → Redeploy.

**"No se han podido cargar los datos"** en el panel de administración → tu sesión ha caducado. Recarga y vuelve a entrar con la contraseña.

**Una empleada no ve ningún cliente** → no le has asignado ninguno todavía, o los que tiene están marcados como inactivos.

**"Ese usuario ya está en uso"** → hay otra empleada con ese mismo usuario. Prueba con `nombre.apellido`.

**Una empleada ha perdido la contraseña** → *Empleadas* → *Editar* → escribe una nueva y guarda. La anterior deja de funcionar.

**Una empleada dice que no puede corregir un día** → o lo has marcado como revisado (pulsa *Reabrir*), o ese día queda fuera de sus tres meses.
