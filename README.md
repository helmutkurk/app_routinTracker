# Ritmo

Una web app para marcar hábitos cada día y seguir tus rachas. Está preparada como PWA para añadirse a la pantalla de inicio del iPhone. Los hábitos se guardan en el almacenamiento local del navegador; no se envían a Cloudflare ni a GitHub.

## Funciones

- Marca tus hábitos cada día y sigue la racha de cada uno.
- Navega a semanas anteriores para completar días pasados (los días futuros están bloqueados).
- Toca el nombre de un hábito para editarlo, cambiar su símbolo o nota, reordenarlo o eliminarlo.
- **Copia de seguridad**: descarga tus datos en un archivo `.json` y restáuralos cuando quieras (por ejemplo, al cambiar de móvil).
- Modo oscuro automático y diseño adaptado al iPhone (notch y barra inferior).
- Funciona sin conexión una vez instalada.

## Probar en el ordenador

Desde esta carpeta, ejecuta:

```sh
python3 -m http.server 8000
```

Abre `http://localhost:8000`. El modo PWA requiere HTTPS o `localhost`; el servidor local sirve para probar la interfaz.

## Publicarla de forma privada y gratuita

1. Crea en GitHub un repositorio nuevo con visibilidad **Private** y sube los archivos de esta carpeta.
2. En Cloudflare, abre **Workers & Pages → Create application → Pages → Connect to Git** y autoriza GitHub.
3. Selecciona el repositorio. No elijas un framework ni configures un comando de compilación: Ritmo es HTML, CSS y JavaScript estático.
4. Despliega la carpeta raíz del repositorio. Cloudflare Pages te dará una dirección `*.pages.dev`.
5. En el proyecto de Pages, configura **Access** para proteger la dirección de producción y las vistas previas. Añade una regla **Allow** para tu correo; puedes usar un código de acceso enviado por email como método de inicio de sesión.
6. Comprueba que, al abrir la dirección en una ventana privada, Cloudflare pide autenticación antes de mostrar la app.

Cloudflare Pages admite repositorios privados. Protege también el dominio de producción `*.pages.dev`: activar la política para previews no basta por sí solo. La [guía oficial de Pages](https://developers.cloudflare.com/pages/get-started/git-integration/) explica la conexión con GitHub y la [guía de Access](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain) cubre el ajuste del dominio `pages.dev`.

## Añadirla al iPhone

Después del despliegue, abre la dirección en Safari, toca **Compartir → Añadir a inicio**, activa **Abrir como app web** y pulsa **Añadir**. La primera visita debe hacerse con internet para cargar y guardar la interfaz en caché. Después, la interfaz puede abrirse sin conexión; para iniciar sesión de nuevo o recibir actualizaciones hará falta conexión.

Tus hábitos se guardan solo en ese navegador del iPhone. Borrar los datos de Safari o desinstalar la app puede borrar el registro; no hay sincronización en la nube. Usa **Descargar copia** de vez en cuando para guardar tu historial.
