---
title: "TV Remote: convertir un portátil viejo en un mando inteligente"
section: "Proyectos"
language: "es"
excerpt: "Cómo reutilicé un Lenovo G580 como centro multimedia controlado desde el móvil con FastAPI, Docker, Chrome, Playwright y ydotoold."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-09-22T19:07:58.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---

# TV remote

El otro día estaba en el salón de mi piso de estudiantes y junto a mis compañeras de piso, queríamos poner algo en la tele que tenemos (es del año de la pera), pero como buen iPad kid que soy yo no quería poner mi portátil porque quería aprovechar para avanzar en algunos proyectos, entonces se me ocurrió rescatar mi viejo portátil que tengo desde los 8 años, un Lenovo G580.

Como el HDMI no es lo suficientemente largo, es súper engorroso manejar el PC para poner cualquier cosa, entonces se me ocurrió crear un sistema que me permita desplegar una web en mi red local para manejar el ordenador y poder usar el móvil a modo de mando inteligente. Junto con esto liberé el ordenador e hice que se ejecutara siempre que se encienda el PC.

Este control remoto me permite pegar URLs (YouTube, Netflix, Prime e incluso mis webs pirata de confianza), pero lo más importante es que mediante un joystick puedo controlar el ratón y mejorar (poco, porque hay latencia) la experiencia de usuario.

Para este proyecto solo necesitas un ordenador viejo con Ubuntu instalado o cualquier distro de Linux, una red Wi-Fi local, un móvil para conectarte a la página, Chrome o Chromium, Docker, Python 3 y una versión moderna de `ydotoold`.

Pd: desconozco si esto ya existe o hay opciones más cómodas o fáciles, supuse que no sería muy complejo y quería ver cómo sería el proceso de crear algo así.

# Diseño de la arquitectura

La idea inicial era muy simple: crear una web con un campo donde pegar una URL y que esta se abriese en el portátil. Al principio pensé en usar un reproductor de vídeo dentro de la propia web, pero esto en la práctica era un marrón para plataformas de streaming convencionales.

La solución fue usar Chrome a modo de reproductor y utilizar la web únicamente como mando.

La arquitectura final terminó siendo la siguiente:

```
Móvil
  │
  │ HTTP
  ▼
FastAPI en Docker :8000
  │
  ├──────────────► Chrome :9222
  │                  │
  │                  └── YouTube / Netflix / Prime / cualquier web
  │
  └──────────────► runtime/ydotool.sock
                     │
                     ▼
                  ydotoold
                     │
                     └── /dev/uinput
                          │
                          └── ratón / teclado
```

FastAPI está dentro de un contenedor Docker que utiliza la red del host y expone la web a la red local. De esta forma, cualquier móvil conectado a la misma Wi-Fi puede entrar simplemente a:

```
http://ip_pc:8000
```

Chrome se ejecuta directamente en Ubuntu. Esto me permite utilizar una sesión normal de navegador, mantener cookies (para no iniciar sesión mil veces) y dejar la compatibilidad con contenido DRM en manos del propio Chrome y de la configuración de Linux.

# Controlar Chrome

Para poder mandar URLs desde el móvil arranco Chrome con el puerto de depuración remota activado. En realidad, el proyecto lo hace mediante `scripts/start-browser.sh`, que busca Chrome o Chromium y configura automáticamente el perfil y el modo de pantalla, pero el comando es básicamente:

```bash
google-chrome \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.local/share/tv-reomote/chrome-profile" \
  --no-first-run \
  --disable-session-crashed-bubble \
  --start-fullscreen \
  https://www.youtube.com/
```

El backend se conecta a ese puerto utilizando Playwright mediante el protocolo de Chrome DevTools:

```python
self._browser = await self._playwright.chromium.connect_over_cdp(
    self.cdp_url,
    timeout=3000
)
```

Esto permite hacer cosas como:

```python
await page.goto(url)
```

y también volver atrás, avanzar, recargar la página, volver a YouTube, escribir texto, poner Chrome en pantalla completa o cerrar ventanas emergentes.

> Algo importante a aclarar es que el puerto 9222 solo escucha en localhost. No necesito ni quiero que cualquier dispositivo de mi red controle directamente Chrome; todas las comunicaciones pasan primero por FastAPI.
> 

# El dolor de cabeza: controlar el ratón

Lo anterior fue sencillo de configurar, pero con esto tuve que dar unas cuantas vueltas más.

Abrir una URL está bien, pero si después quieres hacer cualquier acción que implique mover el ratón (sé que la mayoría de acciones se pueden hacer mediante acciones de Chrome, pero se me hace más incómodo), levantarse del sofá para mover el ratón hace que este proyecto pierda todo el sentido, por eso me decidí a implementar un joystick que controle el ratón.

Cuando desplazo el joystick en el móvil, JS genera pequeños movimientos relativos que manda a la API:

```
POST /api/mouse/move
```

El backend transforma estos movimientos en eventos reales del sistema utilizando el socket Unix de `ydotoold`.

`ydotoold` crea un dispositivo de entrada virtual mediante `/dev/uinput`. En la versión actual del proyecto el daemon se ejecuta directamente en el host y crea `runtime/ydotool.sock`, un socket Unix de datagramas que el contenedor monta en `/run/tv-remote/ydotool.sock`.

El backend no necesita ejecutar el comando `ydotool` para cada movimiento, sino que envía directamente eventos `input_event` de Linux al socket de `ydotoold`, por lo que Ubuntu recibe estos movimientos como si viniesen de un ratón o teclado físico.

Esto permite controlar:

- movimiento del ratón
- clic izquierdo y derecho
- scroll
- flechas del teclado
- Enter
- Escape
- Space (play/pause)
- Tab
- Backspace y Delete
- volumen y silencio
- escritura de texto

La escritura de texto es un caso algo diferente: en vez de pasar por `ydotoold`, se envía directamente a Chrome mediante CDP.

El joystick además intenta no mandar cientos de peticiones si la conexión va algo lenta. Los movimientos pendientes se agrupan y, al soltar el joystick, se descartan los que ya no tienen sentido.

Siendo realistas, la experiencia del joystick es bastante infumable por el delay, pero gracias a los botones y acciones directas de Chrome, como volver atrás, recargar, poner la pantalla completa o cerrar ventanas emergentes, pocas veces es necesario usarlo.

# Automatizando todo

Todo lo anterior es muy interesante, pero para que el proyecto me sea de utilidad el PC tiene que estar siempre conectado a la televisión y listo para usarse.

Tener que hacer `docker compose up`, abrir Chrome, arrancar `ydotoold`, configurar puertos... es un coñazo tan grande que provocaría que nunca lo usase, por eso terminé usando `systemd` y el inicio automático de Ubuntu para arrancar los componentes necesarios.

El daemon de entrada se ejecuta como servicio:

```
tv-remote-ydotoold.service
```

Este servicio carga `/dev/uinput` y arranca la versión de `ydotoold` instalada en:

```
/usr/local/bin/ydotoold
```

Docker utiliza:

```yaml
restart: unless-stopped
```

para recuperar automáticamente el backend.

Chrome, por su parte, se añade al inicio de la sesión gráfica de Ubuntu mediante un archivo `.desktop`, que ejecuta `scripts/start-browser.sh` en pantalla completa.

El objetivo final es bastante simple:

```
encender portátil
      ↓
Ubuntu inicia
      ↓
ydotoold + Docker
      ↓
FastAPI
      ↓
iniciar sesión gráfica
      ↓
Chrome
      ↓
coger el móvil y usar la tele
```

# Problemas varios

Como todo en mi vida, nada me sale bien a la primera.

Una de las partes que más problemas dio fue el maldito `ydotool`. Ubuntu incluía una versión bastante antigua de `ydotoold`, la `0.1.8`, que directamente terminaba con un `segmentation fault` al conectarse el backend.

Los logs eran bastante bonitos:

```
ydotoold: accepted client
Main process exited, code=dumped, status=11/SEGV
```

La solución terminó siendo utilizar una versión moderna de `ydotool`, en este caso `ydotoold` 1.x, adaptar la comunicación mediante sockets Unix de datagramas y dejar el daemon ejecutándose directamente en el host.

En la versión actual el backend se comunica directamente con ese socket enviando eventos nativos de Linux, mientras que Docker simplemente monta el directorio `runtime/` donde se encuentra el socket.

También hubo que pelearse con Docker instalado mediante Snap, permisos sobre `/var/run/docker.sock`, sockets compartidos entre el host y el contenedor y alguna que otra peculiaridad de Wayland.

Docker Snap, además, tiene la peculiaridad de que el proyecto tiene que estar dentro de la carpeta personal del usuario para poder montar correctamente el directorio `runtime/`.

Y, como este portátil tiene una Intel Ivy Bridge que probablemente vio nacer a medio JavaScript moderno, Chrome también avisa alegremente de que algunas tecnologías de aceleración por hardware son demasiado nuevas para él.

Pero funciona.

# Resultado

Al final terminé convirtiendo un Lenovo G580 que estaba cogiendo polvo en una especie de Chromecast tremendamente casero.

Desde el móvil puedo abrir una web, mover el ratón, hacer clic, hacer scroll, escribir, controlar el volumen y manejar las principales funciones del navegador sin acercarme al portátil.

Y posiblemente la mejor parte del proyecto es que prácticamente todo el sistema está construido utilizando herramientas bastante simples:

```
Ubuntu
Docker
FastAPI
Playwright
Chrome DevTools Protocol
ydotoold
/dev/uinput
systemd
HTML / CSS / JavaScript
```

No era un proyecto que tuviese pensado hacer ni algo especialmente necesario, pero surgió de uno de esos pequeños problemas absurdos del día a día que son una buena excusa para montar una arquitectura innecesariamente compleja.

Y ahora nuestra televisión del año de la pera es como un hombre en su crisis de los 40 creyéndose una persona nueva.

## Código fuente

El proyecto completo, junto con las instrucciones de instalación y uso, está disponible en GitHub: [seryio2004/tv-reomote](https://github.com/seryio2004/tv-reomote).
