# Limpiezas Castellón — Web con blog autogestionable y panel de presupuestos

Esta web tiene **un único panel de administración** en **`/admin`** que te permite gestionarlo todo sin tocar código. Dentro tiene un menú lateral con **cinco secciones**:

1. **Blog** → escribir y editar artículos (estilo WordPress, login con GitHub).
2. **Presupuestos recibidos** → ver y gestionar los formularios que rellena la gente en la web.
3. **Crear presupuesto** → elaborar presupuestos formales (plantilla de Oficinas o Comunidades), descargarlos en **PDF con vuestro logo** o enviarlos por email.
4. **Panel Power BI** → ver tu informe de Power BI embebido (necesita un pequeño paso de configuración explicado más abajo).
5. **Calculadora precio/hora** → calcular el precio/hora a cobrar a partir de un Excel con los costes (salario, SS, horas productivas, margen…). Editas el Excel y la calculadora se actualiza.

> **Tiempo de configuración inicial:** unos 40-45 minutos repartidos en varios pasos. Una vez hecho, escribir un artículo o consultar los presupuestos te llevará menos de 5 minutos.

> **Nota sobre los dos accesos:** la pestaña **Blog** entra con tu cuenta de **GitHub**; las pestañas de **presupuestos** entran con una **contraseña** que defines tú. Es así porque el blog publica en GitHub (necesita tu identidad de GitHub) y los presupuestos son privados de la empresa. Todo vive en la misma página `/admin`: al entrar, eliges si vas a presupuestos (contraseña) o al blog (botón "Solo quiero gestionar el blog").

---

## Cómo funcionará el día a día

**Entrar:** ve a `tudominio.com/admin`.
- Para **presupuestos**: escribe tu contraseña y pulsa Entrar.
- Para el **blog**: pulsa "Solo quiero gestionar el blog" y entra con GitHub.

**Para el blog (pestaña Blog):**
1. Pulsas en la colección "Artículos del blog" → "New Artículo"
2. Escribes en un editor visual (negritas, listas, imágenes…) → "Publish"
3. En ~1 minuto el artículo aparece publicado en `tudominio.com/blog`

**Para los presupuestos recibidos (pestaña Presupuestos recibidos):**
1. Un visitante rellena el formulario de la web
2. La solicitud se guarda automáticamente
3. La ves en esta pestaña, con botón directo de WhatsApp, y puedes marcarla como "gestionada" o borrarla

**Para crear y enviar un presupuesto (pestaña Crear presupuesto):**
1. Eliges plantilla: **Oficinas/Empresas** o **Comunidades** (cada una trae el texto de vuestro presupuesto real ya cargado)
2. Rellenas el destinatario, la fecha y, si quieres, ajustas los textos (presentación, descripción del trabajo, importe y notas). Todo es editable
3. Pulsas **Descargar PDF** (sale con vuestro logo real y el mismo formato de carta que usáis, con el membrete de ALBIOL PROJECTS y el registro mercantil) o **Enviar por email**
   - El email abre tu propio correo (Gmail/Outlook) con destinatario, asunto y texto ya escritos. Como el correo no puede adjuntar archivos solo, el PDF se descarga a la vez y solo tienes que arrastrarlo al email antes de enviarlo.

---

## Estructura del proyecto

```
limpiezas-castellon-web/
├── index.html                  ← la web principal (con el formulario ya conectado)
├── blog.njk                    ← genera la página /blog con la lista de artículos
│
├── admin/                      ← EL PANEL ÚNICO
│   ├── index.html              ← panel con las 3 pestañas (blog + presupuestos + crear)
│   └── config.yml              ← ⚠️ AQUÍ pones tu usuario y repo (ver Paso 4)
│
├── admin-logo.js               ← vuestro logo, usado en el PDF de los presupuestos
│
├── datos/                      ← datos editables (se sirven al panel)
│   └── precio-hora.xlsx        ← Excel de la calculadora precio/hora
│
├── posts/                      ← aquí viven los artículos del blog (en Markdown)
│   ├── cada-cuanto-limpiar-oficina.md
│   ├── consejos-comunidad-vecinos-limpia.md
│   └── posts.json              ← config común de los posts (no tocar)
│
├── api/                        ← funciones de servidor
│   ├── auth.js                 ← login del blog con GitHub
│   ├── callback.js             ← login del blog con GitHub
│   ├── presupuesto.js          ← guarda los formularios que rellena la gente
│   └── solicitudes.js          ← devuelve los formularios al panel (con contraseña)
│
├── _includes/post.njk          ← plantilla visual de cada artículo
├── _data/site.js               ← datos de contacto (teléfono, email, dirección)
├── img/                        ← logo e imágenes (incl. las que subas al blog)
│
├── package.json
├── eleventy.config.js          ← config del generador del blog
├── vercel.json                 ← config de despliegue
└── .gitignore
```

---

## PASO 1 — Subir el proyecto a GitHub

**~5 minutos**

1. Descomprime el ZIP en tu ordenador.
2. Entra en https://github.com/new y crea un repositorio, por ejemplo `limpiezas-castellon-web`. Déjalo **Private** si quieres. Pulsa **Create repository**.
3. En la página siguiente pulsa **uploading an existing file**.
4. Arrastra **todo el contenido** de la carpeta descomprimida (los archivos y carpetas de dentro, no la carpeta entera).
5. Escribe un mensaje como "Primera versión" y pulsa **Commit changes**.

> ⚠️ **Importante:** asegúrate de que se sube **`eleventy.config.js`** (es el que hace funcionar el blog). Tras subir, comprueba en GitHub que aparece en la lista de archivos. Si falta algún archivo, vuelve a "Add file → Upload files" y súbelo. (En versiones anteriores este archivo se llamaba `.eleventy.js` con un punto delante, y al arrastrarlo a GitHub a veces no se subía; por eso ahora se llama sin punto.)

---

## PASO 2 — Desplegar en Vercel

**~5 minutos**

1. Entra en https://vercel.com y regístrate con tu cuenta de GitHub.
2. Pulsa **Add New… → Project** e importa el repositorio `limpiezas-castellon-web`.
3. Vercel detectará Eleventy solo. **No cambies nada** y pulsa **Deploy**.
4. En un minuto tendrás la web online en una URL tipo `limpiezas-castellon-web.vercel.app`.

Comprueba que la web carga y que `/blog` muestra los dos artículos de ejemplo.

---

## PASO 3 — Activar el almacén de los formularios (Upstash Redis)

**~5 minutos.** Esto es lo que hace que las solicitudes se guarden.

> Nota: Vercel ha sustituido su antiguo "Vercel KV" por **Upstash Redis** dentro de su Marketplace. El código funciona igual; solo cambia el nombre del producto que tienes que crear.

1. En Vercel, dentro de tu proyecto, ve a la pestaña **Storage**.
2. Pulsa **Create Database** y elige **Upstash → Redis** (o "Redis" / "KV" si tu cuenta aún lo muestra así). Ponle un nombre, por ejemplo `presupuestos`, y créala.
3. Cuando te lo ofrezca, pulsa **Connect to Project** y conéctala a tu proyecto. Esto añade solas las variables que la API necesita (`KV_REST_API_URL` y `KV_REST_API_TOKEN`).
4. Ve a **Settings → Environment Variables** y añade una variable más:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** la contraseña que tú quieras para entrar en el panel de presupuestos (apúntala).
5. Pulsa **Save**. Luego ve a **Deployments → ... (los tres puntos del último) → Redeploy** para que se apliquen los cambios.

Ya puedes probar: rellena el formulario en tu web y luego entra en `tudominio.com/admin`, mete tu `ADMIN_PASSWORD` y deberías ver la solicitud.

> Si al conectar Upstash las variables se llamaran distinto a `KV_REST_API_URL` / `KV_REST_API_TOKEN`, avísame y te paso la pequeña corrección. Con la integración oficial de Vercel suelen mantener esos nombres y todo funciona sin tocar nada.

---

## PASO 4 — Configurar el panel del blog (login con GitHub)

**~15 minutos.** Esto activa `/admin` para escribir artículos.

### 4.1 — Crear la "OAuth App" en GitHub

1. Entra en https://github.com/settings/developers → pestaña **OAuth Apps** → **New OAuth App**.
2. Rellena:
   - **Application name:** `Blog Limpiezas Castellón`
   - **Homepage URL:** `https://TU_DOMINIO.vercel.app` (tu URL de Vercel)
   - **Authorization callback URL:** `https://TU_DOMINIO.vercel.app/api/callback`
3. Pulsa **Register application**.
4. Copia el **Client ID**.
5. Pulsa **Generate a new client secret** y copia el **Client Secret** (solo se muestra una vez).

### 4.2 — Añadir esas dos claves a Vercel

En Vercel → tu proyecto → **Settings → Environment Variables**, añade:
- `OAUTH_CLIENT_ID` → el Client ID que copiaste
- `OAUTH_CLIENT_SECRET` → el Client Secret que copiaste

Guarda y haz **Redeploy** otra vez.

### 4.3 — Poner tus datos en config.yml

Edita el archivo **`admin/config.yml`** en tu repo de GitHub (puedes hacerlo desde la propia web de GitHub con el lápiz ✏️) y cambia estas dos líneas:

```yaml
  repo: TU_USUARIO/TU_REPO                  # ej:  pepe/limpiezas-castellon-web
  base_url: https://TU_DOMINIO.vercel.app   # tu URL de Vercel, sin barra al final
```

Commit. Espera 1 minuto.

Ahora entra en `tudominio.com/admin`, pulsa "Solo quiero gestionar el blog", luego **Login with GitHub**, y verás el editor con los dos artículos. ¡Listo para escribir!

---

## PASO 5 — (Opcional) Conectar tu dominio limpiezascastellon.es

Cuando esta web esté lista para sustituir a la de Wix:

1. En Vercel → proyecto → **Settings → Domains** → añade `limpiezascastellon.es`.
2. Vercel te dará unos registros DNS. Ponlos donde tengas contratado el dominio.
3. **Importante:** después de conectar el dominio, vuelve al Paso 4.1 y cambia en la OAuth App de GitHub la *Homepage URL* y la *callback* a `https://limpiezascastellon.es` y `https://limpiezascastellon.es/api/callback`. Y en `admin/config.yml` cambia el `base_url` a `https://limpiezascastellon.es`. Si no, el login del blog dejará de funcionar.

> Mientras no conectes el dominio, tu web actual de Wix sigue intacta. El cambio solo ocurre cuando muevas el dominio.

---

## PASO 6 — (Opcional) Conectar tu panel de Power BI

Para que tu informe de Power BI aparezca en la pestaña **Panel Power BI**:

1. Abre tu informe en **Power BI Service** (app.powerbi.com).
2. Menú **Archivo → Insertar informe → Publicar en la web (público)**.
3. Pulsa **Crear código de inserción**. Power BI te dará un enlace tipo `https://app.powerbi.com/view?r=eyJrIjoi…`.
4. Copia ese enlace.
5. En tu repositorio en GitHub, abre el archivo `admin/index.html`, busca la línea que pone:
   ```js
   const POWERBI_EMBED_URL = "";
   ```
   Y pega el enlace entre las comillas:
   ```js
   const POWERBI_EMBED_URL = "https://app.powerbi.com/view?r=eyJrIjoi…";
   ```
6. Guarda los cambios. Vercel republica solo y al entrar en `/admin → Panel Power BI` verás tu informe.

> ⚠️ **Importante:** la opción "Publicar en la web" hace tu informe **público en internet** a cualquiera con el enlace. Úsalo solo con datos no confidenciales (KPIs comerciales, métricas globales). Si necesitas embed privado con login, hace falta una licencia Power BI Pro/Premium y otra configuración; avísame y te guío.

---

## PASO 7 — (Opcional) Personalizar la calculadora de precio/hora

La pestaña **Calculadora precio/hora** lee los datos del archivo `datos/precio-hora.xlsx`. Ya viene con un modelo completo para el sector limpieza con:

- Salario base mensual, pagas extra, pluses
- % de Seguridad Social a cargo de la empresa
- Uniforme, formación PRL, productos
- Horas anuales según convenio, días no productivos
- Margen empresarial
- Precio/hora final (sin IVA y con IVA 21%)

**Para cambiar los valores de forma permanente:**

1. Descarga el archivo `datos/precio-hora.xlsx` desde GitHub.
2. Ábrelo en Excel y modifica las celdas en amarillo (las azules son los valores editables; las negras son fórmulas que se recalculan solas).
3. Súbelo a GitHub reemplazando el original (Add file → Upload).
4. Vercel republica y la calculadora cargará los nuevos valores.

**Para hacer un cálculo rápido sin guardar nada:**

En la propia pestaña puedes cambiar cualquier valor editable y el precio/hora se actualiza al instante. También puedes pulsar "Cargar otro Excel" para subir uno temporal desde tu ordenador.

---

## Preguntas frecuentes

**¿Tengo que pagar algo?**
No. GitHub, Vercel, Vercel KV (plan gratuito) y Decap CMS son gratis para este tamaño de web.

**¿Puedo añadir más personas que escriban en el blog?**
Sí, basta con que tengan acceso al repositorio de GitHub.

**¿Los presupuestos llegan también a mi email?**
De momento se guardan en el panel. Si quieres que además te lleguen por email o WhatsApp automáticamente, se puede añadir; pídelo y te explico cómo.

**¿Cómo cambio mi teléfono o email de toda la web del blog?**
Edita el archivo `_data/site.js`.

**¿Cómo cambio los datos que salen en el presupuesto (razón social, NIF, registro mercantil…)?**
Abre `admin/index.html` y, dentro del `<script>`, en el bloque `EMPRESA = { ... }`, edita lo que necesites (razón social ALBIOL PROJECTS, membrete, NIF, teléfono, email, texto del registro mercantil).

**¿Puedo cambiar el texto por defecto de cada plantilla (Oficinas / Comunidades)?**
Sí. En ese mismo archivo, en el bloque `PLANTILLAS`, puedes editar la presentación, la descripción del trabajo, el importe y las notas de cada plantilla.

**¿Y el logo del PDF?**
El logo va en el archivo `admin-logo.js` (es vuestro logo real, ya incluido). No hace falta tocar nada salvo que cambiéis de logo.

**Quiero cambiar la contraseña del panel de presupuestos.**
En Vercel → Settings → Environment Variables, edita `ADMIN_PASSWORD` y haz Redeploy.

---

## Notas técnicas

- El blog usa **Eleventy** (genera HTML estático rápido y bueno para SEO) y **Decap CMS** para la edición visual.
- Los formularios se guardan en **Vercel KV**. La API valida un campo-trampa antispam y limita la longitud de los textos.
- El panel de presupuestos está protegido por contraseña (`ADMIN_PASSWORD`) y marcado como `noindex` para que no aparezca en Google.
- Las imágenes de la web principal siguen siendo de muestra (Unsplash). Para la versión definitiva, sustitúyelas por fotos reales de vuestros trabajos.
