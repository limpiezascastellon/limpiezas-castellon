# SEO — Qué se ha hecho y qué te toca a ti

Este archivo no se publica en la web. Es la guía para mantener el posicionamiento.

---

## 1. Lo que ya está hecho

### Estructura de páginas (el cambio más importante)

Antes toda la web era **una sola dirección**: `Servicios`, `Nosotros` y `Contacto` eran
trozos ocultos que aparecían con JavaScript, y los enlaces eran `onclick`, que Google no
sigue. Con una sola URL solo se puede competir por una búsqueda.

Ahora hay **14 páginas indexables**, cada una apuntando a una búsqueda distinta:

| Dirección | Búsqueda objetivo |
|---|---|
| `/` | empresa de limpieza en Castellón |
| `/servicios` | servicios de limpieza Castellón |
| `/limpieza-de-comunidades-castellon` | limpieza de comunidades de vecinos Castellón |
| `/limpieza-de-oficinas-castellon` | limpieza de oficinas Castellón |
| `/limpieza-grao-de-castellon` | empresa de limpieza Grao de Castellón |
| `/limpieza-vila-real` | empresa de limpieza Vila-real |
| `/limpieza-onda` | empresa de limpieza Onda |
| `/limpieza-benicassim` | empresa de limpieza Benicàssim |
| `/zonas`, `/nosotros`, `/contacto`, `/blog` | apoyo y conversión |

Castellón capital se trabaja desde la portada a propósito: si se creara además una página
`/limpieza-castellon`, competiría contra la portada por la misma búsqueda y las dos
saldrían perjudicadas.

### Ficha técnica

- Título y descripción únicos en cada página, con el municipio dentro.
- Etiqueta canónica en todas las páginas.
- `sitemap.xml` y `robots.txt`.
- Datos estructurados: `LocalBusiness` (con dirección, teléfono, horario, coordenadas y las
  cinco poblaciones como zona de servicio), `Service`, `BreadcrumbList`, `FAQPage` y
  `BlogPosting` en los artículos.
- Imágenes convertidas a `<img>` reales con texto alternativo descriptivo. Antes eran fondos
  CSS: invisibles para Google.
- CSS en archivo externo cacheado, imagen del hero precargada, cabeceras de caché y de
  seguridad en `vercel.json`.

### Contenido

- Fuera el bloque de opiniones. En su lugar, **preguntas frecuentes** desplegables en la
  portada y en cada página de servicio y de población, con marcado `FAQPage`. Nunca pongas
  reseñas inventadas ni marcado `aggregateRating` falso: es motivo de penalización manual y
  además los usuarios lo detectan.
- Cada página de población tiene texto propio. **No copies y pegues entre ellas**: el
  contenido duplicado hace que Google elija una sola y descarte el resto.

---

## 2. Lo que tienes que hacer tú (por orden de impacto)

### a) Ficha de Google Business Profile — es lo que más va a mover la aguja

Para "empresa de limpieza en Castellón", el mapa de Google sale por encima de los resultados
normales. Sin ficha verificada no apareces ahí, por muy bien optimizada que esté la web.

1. Crea o reclama la ficha en `business.google.com`.
2. Categoría principal: **Servicio de limpieza**.
3. Dirección exactamente igual que en la web: `C/ Enmedio, 22 6º, 12001 Castellón`.
   Que coincida el nombre, la dirección y el teléfono en todas partes es determinante.
4. Añade las cuatro poblaciones como área de servicio.
5. Sube fotos reales del equipo trabajando. Valen mucho más que las ilustraciones.
6. Pide reseñas a tus clientes actuales, sobre todo a presidentes de comunidad y
   administradores de fincas. Reales, de una en una, sin prisa.

Cuando tengas la ficha, pega su enlace en `_data/site.js`, campo `googleBusiness`.

### b) Google Search Console

1. Entra en `search.google.com/search-console` y verifica el dominio.
2. Envía `https://www.limpiezascastellon.es/sitemap.xml`.
3. A las dos o tres semanas, mira el informe de Rendimiento: te dirá por qué búsquedas
   apareces. Ahí está la mejor lista de ideas para nuevos artículos.

### c) Completa los datos que faltan

- `aviso-legal.njk` y `politica-de-privacidad.njk` tienen campos entre corchetes
  (razón social, NIF, datos registrales). **Es obligatorio rellenarlos** por la Ley 34/2002.
  El formulario de presupuesto ya enlaza a la política de privacidad, como exige el RGPD.
- `_data/site.js`: pon las coordenadas exactas de la oficina. Ahora están las del centro de
  Castellón. En Google Maps, clic derecho sobre el portal y copiar coordenadas.
- Si tenéis Instagram o Facebook, añádelos al array `perfiles` de `_data/site.js`.

### d) Un artículo al mes en el blog

El blog es lo que hace crecer el tráfico a largo plazo. Escribe sobre lo que te preguntan
los clientes por teléfono. Ideas ordenadas por interés de búsqueda:

- Cuánto cuesta la limpieza de una comunidad de vecinos
- ¿Quién paga la limpieza en una comunidad de propietarios?
- Cómo cambiar de empresa de limpieza sin dejar la comunidad sin servicio
- Cada cuánto hay que baldear un garaje comunitario
- Qué debe incluir un contrato de limpieza de comunidades
- Limpieza de portales con suelo de terrazo: qué productos evitar

Desde el panel `/admin` se publican sin tocar código. Al escribir, enlaza dentro del texto a
`/limpieza-de-comunidades-castellon` o `/limpieza-de-oficinas-castellon`: los enlaces internos
reparten autoridad hacia las páginas que venden.

---

## 3. Reglas para no romper lo hecho

- **No cambies las direcciones de las páginas.** Si alguna vez hay que hacerlo, crea antes la
  redirección 301 en el bloque `redirects` de `vercel.json`.
- **Un solo `<h1>` por página.** Es el título grande de la cabecera azul.
- **No instales Google Analytics sin banner de cookies.** Ahora mismo la web no usa cookies de
  seguimiento y por eso la política de cookies es tan sencilla. En cuanto añadas Analytics o el
  píxel de Meta, estás obligado a pedir consentimiento previo y a actualizar esa página.
- **Nada de reseñas inventadas** ni de estrellas en el código si no vienen de clientes reales.

---

## 4. Cómo añadir una población nueva

Si algún día ampliáis zona, no hay que tocar plantillas. Abre `_data/zonas.js`, copia un
bloque entero y cambia los textos. Se generan solas la página, el enlace del pie, el listado
de zonas y la entrada del sitemap.

Escribe texto original para esa población (qué tipo de edificios hay, qué problema concreto
tienen). Si te limitas a cambiar el nombre del pueblo, Google lo trata como página duplicada
y no la posiciona.
