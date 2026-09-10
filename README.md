# Monetix Digital — web corporativa

Landing de **Monetix Digital**, agencia de marketing de resultados para clínicas dentales
y centros de estética. HTML, CSS y JavaScript sin dependencias ni compilación: lo que hay
en el repositorio es exactamente lo que se sube al servidor.

---

## Estructura

```
.
├── index.html            Página principal (una sola página con anclas)
├── aviso-legal.html      Aviso legal
├── privacidad.html       Política de privacidad
├── cookies.html          Política de cookies
├── 404.html              Página de error
├── .htaccess             HTTPS, URLs limpias, caché, compresión y cabeceras
├── .cpanel.yml           Instrucciones de despliegue automático de cPanel
├── robots.txt
├── sitemap.xml
├── api/
│   └── contacto.php      Recibe el formulario y envía el correo
└── assets/
    ├── css/styles.css
    ├── js/main.js
    └── img/              Logotipo e imagen para redes sociales
```

---

## Puesta en marcha en cPanel (una sola vez)

### 1. Clonar el repositorio en el hosting

En cPanel: **Files → Git™ Version Control → Create**.

| Campo | Valor |
|---|---|
| Clone a Repository | activado |
| Clone URL | `https://github.com/josekgullon-sudo/monetix.git` |
| Repository Path | `/home/USUARIO/repositories/monetix` |
| Repository Name | `monetix` |

> Si el repositorio es privado, cPanel pedirá credenciales. La forma limpia es generar una
> clave SSH en cPanel (**Security → SSH Access**) y añadir la clave pública en GitHub como
> *Deploy key*. Entonces la Clone URL sería `git@github.com:josekgullon-sudo/monetix.git`.

**Importante:** el repositorio se clona en `repositories/`, **no** en `public_html`. El paso
de copiar los archivos al sitio público lo hace `.cpanel.yml`.

### 2. Ajustar la ruta de despliegue

Abre `.cpanel.yml` y sustituye `USUARIO` por tu usuario real de cPanel en esta línea:

```yaml
- export DEPLOYPATH=/home/USUARIO/public_html
```

Confirma el nombre en cPanel, en el panel derecho de "Información general".

### 3. Configurar el correo del formulario

1. En cPanel crea la cuenta **hola@monetixdigital.com** (Email → Email Accounts).
2. Crea también **no-reply@monetixdigital.com**: es la dirección desde la que sale el correo.
   Si el remitente no pertenece al dominio, los mensajes acaban en spam.
3. Si prefieres otras direcciones, cámbialas en las constantes de `api/contacto.php`.

### 4. Desplegar

En **Git™ Version Control → Manage → Pull or Deploy**:

- **Update from Remote** trae los últimos commits de GitHub.
- **Deploy HEAD Commit** ejecuta `.cpanel.yml` y copia los archivos a `public_html`.

A partir de aquí, publicar un cambio son esos dos botones.

---

## Flujo de trabajo habitual

```bash
git add .
git commit -m "Cambio en la sección de servicios"
git push origin main
```

Y después, en cPanel: *Update from Remote* → *Deploy HEAD Commit*.

---

## Pendiente de completar antes de publicar

Estos puntos necesitan datos que solo tú tienes. Están marcados en el código con `[COMPLETAR: ...]`:

- **Datos societarios** de la LLC (denominación, EIN, domicilio, jurisdicción) en
  `aviso-legal.html` y `privacidad.html`.
- **Proveedor de hosting** como encargado de tratamiento, en `privacidad.html`.
- **Certificado SSL** activo en cPanel antes de que la redirección a HTTPS del `.htaccess`
  tenga sentido. Con AutoSSL suele instalarse solo.
- **Cuenta de correo** `hola@` y `no-reply@` creadas en el hosting.

Comprueba que no queda ninguno:

```bash
grep -rn "COMPLETAR" --include="*.html" .
```

---

## Decisiones de contenido

La web **no incluye testimonios, logotipos de clientes ni cifras de resultados**, porque
todavía no hay clientes que los respalden. En su lugar, el argumento de venta es el modelo
—30 % del incremento interanual, sin cuota fija ni permanencia— y el método de trabajo.
La sección de preguntas frecuentes lo dice de forma explícita. Cuando haya casos reales,
ese es el primer sitio donde conviene añadirlos.

El simulador de honorarios calcula sobre los valores que introduce el visitante y lleva un
aviso claro de que no es una previsión de resultados.

---

## Desarrollo en local

No hace falta compilar nada. Basta con un servidor estático:

```bash
python3 -m http.server 8000
```

Y abrir <http://localhost:8000>. El formulario solo funciona en un servidor con PHP;
en local mostrará el mensaje de error alternativo con el correo de contacto.
