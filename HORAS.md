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

## Cómo lo usa la empleada

Abre la página y ya está dentro (la sesión le dura un mes, no tiene que escribir la contraseña cada vez).

Ve **la semana entera**, de lunes a domingo, con los sábados y domingos en color distinto. Puede moverse a semanas anteriores con las flechas. En cada día pulsa **Apuntar horas de este día**, elige el cliente y pone la hora de entrada y la de salida. Antes de guardar le aparece el cálculo: *"Son 4 h 30 min"*.

Tres cosas que le ahorran tiempo cuando rellena de golpe:

- **Marcar varios días a la vez.** Al apuntar un horario, debajo le salen los demás días de esa semana. Si hizo lo mismo el martes, el miércoles y el jueves, los marca y se guardan los tres de una vez.
- **Copiar la semana pasada.** Si la semana está vacía y la anterior tiene horarios, le aparece un botón que los copia enteros. Luego corrige lo que no cuadre.
- **No se duplica.** Si pulsa dos veces sin querer, el sistema detecta lo repetido y no lo guarda otra vez.

También puede apuntar **varios turnos el mismo día** (por ejemplo mañana en una comunidad y tarde en una oficina), y turnos de noche que cruzan las doce (de 22:00 a 02:00 cuenta 4 horas).

Arriba tiene siempre el **total de la semana** y el reparto por cliente. En la pestaña *Resumen del mes*, el total del mes, cuántas horas fueron en fin de semana y el desglose día a día.

Para corregir, toca sobre la línea de horas. Puede cambiarla o borrarla. La empleada **no ve precios ni importes**, solo sus horas.

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

## La regla de los dos meses

- La empleada **solo ve y solo puede tocar sus últimos dos meses**. Lo anterior desaparece de su panel, y tampoco puede apuntar horas en fechas más antiguas.
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

**"No se han podido cargar los datos"** en el panel de administración → tu sesión ha caducado. Recarga y vuelve a entrar con la contraseña.

**Una empleada no ve ningún cliente** → no le has asignado ninguno todavía, o los que tiene están marcados como inactivos.

**"Ese usuario ya está en uso"** → hay otra empleada con ese mismo usuario. Prueba con `nombre.apellido`.

**Una empleada ha perdido la contraseña** → *Empleadas* → *Editar* → escribe una nueva y guarda. La anterior deja de funcionar.

**Una empleada dice que no puede corregir un día** → o lo has marcado como revisado (pulsa *Reabrir*), o ese día tiene más de dos meses.
