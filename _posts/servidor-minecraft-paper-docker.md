---
title: "Servidor de Minecraft con PaperMC, Docker y un panel web propio"
section: "Infraestructura"
language: "es"
excerpt: "Cómo monté un servidor de Minecraft con PaperMC en Docker, con copias automáticas, y un panel web en Python para controlarlo desde el navegador."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-11-26T10:00:00.000Z"
draft: true
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

> **PENDIENTE:** el arranque. Por qué quisiste un servidor propio (¿amigos, piso, jugar sin pagar un Realm?), desde cuándo juegas y qué te hizo pensar "esto lo monto yo".

Tengo un servidor en casa en el que ya corren Nextcloud, Jellyfin y unos cuantos proyectos en Docker, así que meter Minecraft ahí era lo natural. El servidor en sí se montó rápido; lo que me llevó más tiempo fue lo de alrededor: copias de seguridad automáticas y una web para no tener que abrir una terminal cada vez que alguien me pide reiniciar el servidor o cambiar la dificultad.

![Panel web de control del servidor de Minecraft: estado, RAM y CPU del contenedor y botones para arrancar, reiniciar, guardar y detener](/assets/blog/servidor-minecraft-paper-docker/panel-resumen.webp)

## Por qué Paper y no el servidor oficial

[PaperMC](https://papermc.io/) es un servidor de Minecraft Java compatible con el cliente normal, pero con muchas optimizaciones de rendimiento y correcciones encima del servidor oficial. Para un servidor pequeño en casa eso se nota: aguanta mejor las granjas, la carga de chunks y los momentos en los que varios jugadores exploran a la vez.

La otra diferencia importante es que Paper usa **plugins** (la API de Bukkit/Spigot), no mods. Los plugins funcionan solo en el servidor, así que los jugadores entran con el Minecraft de siempre, sin instalar nada. Si lo que quieres es cambiar el juego con mods de Fabric o Forge, Paper no es la opción.

Ahora mismo el único plugin que tengo instalado es [spark](https://spark.lucko.me/), un perfilador que dice qué está consumiendo cada tick cuando el servidor va lento.

> **PENDIENTE:** ¿qué tal rinde? Si tienes algún dato de spark (TPS, uso de memoria) o una anécdota de lag que resolviste, va aquí.

## El servidor en Docker

Uso la imagen [`itzg/minecraft-server`](https://docker-minecraft-server.readthedocs.io/), que es prácticamente el estándar para esto: con variables de entorno eliges el tipo de servidor, la versión y la configuración, y ella se encarga de descargar Paper, aceptar la EULA y generar `server.properties`.

Todo vive en una carpeta del servidor, con un `compose.yaml` y una carpeta `data/` donde están el mundo, los plugins y la configuración:

```yaml
name: minecraft

services:
  mc:
    image: itzg/minecraft-server:java25
    restart: unless-stopped
    ports:
      # Dentro del contenedor Minecraft siempre usa el 25565;
      # el puerto público, a la izquierda, lo eliges tú.
      - "PUERTO_PUBLICO:25565/tcp"
    environment:
      EULA: "TRUE"
      TYPE: "PAPER"
      VERSION: "26.3"
      TZ: "Europe/Madrid"
      UID: "1000"
      GID: "1000"
      INIT_MEMORY: "1G"
      MAX_MEMORY: "4G"
      MODE: "survival"
      DIFFICULTY: "normal"
      MAX_PLAYERS: "8"
      VIEW_DISTANCE: "12"
      SIMULATION_DISTANCE: "10"
      ENABLE_RCON: "true"
      RCON_PASSWORD_FILE: /run/secrets/rcon_password
    mem_limit: 5g
    stop_grace_period: 2m
    volumes:
      - ./data:/data
      - ./rcon_password:/run/secrets/rcon_password:ro
```

Algunas decisiones que no son obvias:

- **`UID` y `GID` a 1000**: los archivos del mundo pertenecen a mi usuario y no a root, así que puedo copiarlos o editarlos sin `sudo`.
- **`MAX_MEMORY` de 4 GB y `mem_limit` de 5 GB**: Java necesita algo de margen por encima del heap. Si el límite del contenedor es igual al heap, Docker lo mata en cuanto la JVM pide memoria fuera de él.
- **`stop_grace_period: 2m`**: al parar, Minecraft guarda el mundo. Con los 10 segundos por defecto, Docker podría matarlo a mitad de guardado.
- **RCON con contraseña en un archivo**: RCON es la consola remota del servidor. La contraseña está en `rcon_password`, con permisos `600`, y no dentro del `compose.yaml`. El puerto de RCON no se publica: solo se usa dentro de la red de Docker.

## Copias de seguridad automáticas

Perder un mundo después de semanas jugando es de las peores cosas que pueden pasar, así que las copias son un segundo servicio en el mismo Compose, con [`itzg/mc-backup`](https://github.com/itzg/docker-mc-backup):

```yaml
  backups:
    image: itzg/mc-backup:latest
    restart: unless-stopped
    user: "1000:1000"
    depends_on:
      mc:
        condition: service_healthy
    environment:
      RCON_HOST: "mc"
      RCON_PASSWORD_FILE: /run/secrets/rcon_password
      BACKUP_METHOD: "tar"
      BACKUP_INTERVAL: "12h"
      INITIAL_DELAY: "30m"
      PRUNE_BACKUPS_DAYS: "14"
    volumes:
      - ./data:/data:ro
      - /ruta/a/las/copias:/backups
      - ./rcon_password:/run/secrets/rcon_password:ro
```

Lo interesante es cómo hace la copia sin parar el servidor: por RCON manda `save-off` y `save-all`, para que Minecraft escriba todo a disco y deje de tocar los archivos; comprime el mundo y vuelve a activar el guardado con `save-on`. El mundo se monta en **solo lectura** (`:ro`), así que el contenedor de copias no puede estropear nada aunque falle. Hace una copia cada 12 horas y borra las de más de 14 días.

![Pestaña de copias del panel: lista de copias de seguridad con su tamaño y fecha, y botón para crear una al momento](/assets/blog/servidor-minecraft-paper-docker/panel-copias.webp)

## El panel web

Para administrar el servidor tenía que entrar por SSH, ir a la carpeta y escribir `docker compose ...` o `docker exec ... rcon-cli ...`. Para mí no es un problema, pero no puedo pedirle eso a nadie más, y desde el móvil es incómodo. Así que hice una web.

![Pestaña de configuración del panel: MOTD, jugadores máximos, distancia de visión, dificultad, modo de juego y PvP](/assets/blog/servidor-minecraft-paper-docker/panel-configuracion.webp)

Desde el panel puedo:

- Ver el estado del contenedor, su CPU y RAM y quién está conectado.
- Arrancar, detener y reiniciar el servidor, guardar el mundo y lanzar una copia en el momento.
- Gestionar la whitelist, expulsar jugadores, dar o quitar OP y escribir en el chat.
- Cambiar el MOTD, el número máximo de jugadores, la distancia de visión, la dificultad, el modo de juego y el PvP.
- Ver los últimos registros del servidor.
- Cambiar la versión de Minecraft y el tipo de servidor (Vanilla, Paper, Fabric, Forge o NeoForge) y subir, activar o desactivar mods.

![Pestaña de jugadores del panel: quién está conectado, gestión de whitelist, expulsar y OP, y mensajes al chat](/assets/blog/servidor-minecraft-paper-docker/panel-jugadores.webp)

### Sin frameworks ni dependencias

El backend es un único `server.py` con la librería estándar de Python: `http.server` para la web y `subprocess` para hablar con Docker. El frontend es HTML, CSS y JavaScript sin compilar. No hay `pip install`, ni `node_modules`, ni nada que actualizar aparte de Python.

La idea central es que **el panel no ejecuta comandos arbitrarios**. Cada botón corresponde a una acción de una lista cerrada, y todo lo que viene del navegador se valida antes de llegar a Docker:

```python
def execute_action(body: dict) -> str:
    name = body.get("action")
    if name == "start":
        return compose("up", "-d", timeout=180)
    if name == "stop":
        return compose("stop", "backups", "mc", timeout=150)
    if name == "save":
        return rcon("save-all")
    if name in ("whitelist_add", "whitelist_remove", "kick", "op", "deop"):
        player = body.get("player", "")
        if not isinstance(player, str) or not NAME_RE.fullmatch(player):
            raise ValueError("Nombre de jugador no válido")
        ...
    raise ValueError("Acción no permitida")
```

Los comandos se lanzan con `subprocess.run` pasando una lista de argumentos, nunca una cadena con `shell=True`. Así, un nombre de jugador como `x; rm -rf /` no puede convertirse en un comando, y además la expresión regular solo deja pasar nombres válidos de Minecraft: de 3 a 16 letras, números o guiones bajos.

### Editar el Compose sin romperlo

Cambiar la dificultad o el MOTD significa modificar el `compose.yaml` y recrear el contenedor. Es la parte más delicada, porque un YAML mal escrito deja el servidor sin arrancar. El panel lo hace en varios pasos:

1. Solo acepta las variables de una lista, cada una con su validación. Por ejemplo, `VIEW_DISTANCE` tiene que ser un entero entre 3 y 12.
2. Escribe el resultado en un archivo temporal y ejecuta `docker compose config -q` sobre él. Si Docker no lo acepta, no se toca el original.
3. Guarda una copia del Compose anterior (`compose.before-panel-<fecha>.yaml`).
4. Sustituye el archivo de forma atómica con `os.replace` y ejecuta `docker compose up -d`.

### Versiones y mods

Cambiar de versión usa el mismo mecanismo. El panel consulta el catálogo oficial de Mojang para ofrecer solo versiones estables, y deja elegir el tipo de servidor: Vanilla, Paper, Fabric, Forge o NeoForge. Para tocar la versión o los mods, el servidor tiene que estar **detenido**. Al guardar no arranca nada: escribe el Compose (con su copia de seguridad, como antes) y la imagen de Docker descarga la versión nueva en el siguiente arranque.

![Pestaña de versiones del panel: tipo de servidor, versión de Minecraft y aviso de hacer una copia antes de cambiar](/assets/blog/servidor-minecraft-paper-docker/panel-versiones.webp)

Paper funciona con plugins, pero quería que el panel también sirviera si algún día cambio a Fabric o Forge, así que tiene un gestor de mods:

- Se suben archivos `.jar` de hasta 20 MiB. Antes de aceptarlos, el panel comprueba que el JAR trae los metadatos del cargador elegido (`fabric.mod.json` en Fabric, `META-INF/mods.toml` en Forge…). No los ejecuta ni los descomprime.
- Desactivar un mod solo lo renombra a `.jar.disabled`, y únicamente se pueden borrar los que están desactivados. Así es difícil eliminar uno por error.
- No sobrescribe archivos existentes ni sigue enlaces simbólicos dentro de la carpeta `mods`.
- Cada mod se puede descargar, para tenerlo también en el ordenador.

![Pestaña de mods del panel con un servidor Fabric de ejemplo: subida de archivos JAR y lista de mods con botones para descargar, activar, desactivar y eliminar](/assets/blog/servidor-minecraft-paper-docker/panel-mods.webp)

### Seguridad

Que una web pueda controlar Docker es delicado: **tener acceso a Docker equivale prácticamente a ser root en la máquina**. Por eso el panel tiene dos modos.

En **modo LAN**, que es el que uso, el panel escucha solo en la IP local del servidor y rechaza cualquier petición que no venga de mi red local o que traiga una cabecera `Host` inesperada. No hay contraseña, pero cada acción necesita un token anti-CSRF, para que otra web abierta en el navegador no pueda pulsar botones por mí.

En **modo público**, pensado para usarlo desde fuera de casa:

- El panel solo escucha en `127.0.0.1`, y delante va [Caddy](https://caddyserver.com/) con HTTPS automático.
- Hace falta usuario y contraseña. La contraseña se guarda como hash scrypt con sal aleatoria y se compara en tiempo constante.
- Los intentos de inicio de sesión están limitados: 10 cada 5 minutos.
- Si falta alguno de esos requisitos, el panel se niega a arrancar en lugar de quedar expuesto.

En los dos modos, las respuestas llevan cabeceras de seguridad (`Content-Security-Policy`, `X-Frame-Options`…) y las cookies son `HttpOnly` y `SameSite=Strict`.

> **PENDIENTE:** cuéntame si el servidor de Minecraft está abierto a Internet. Ahora mismo tiene `ONLINE_MODE: "false"` y la whitelist desactivada, lo que permite entrar con cualquier nombre sin cuenta de Mojang, incluido el nombre de un OP. Si el puerto de Minecraft está redirigido en el router, conviene activar la whitelist o un plugin de autenticación como AuthMe, y explicarlo aquí.

### Arrancarlo con el servidor

El panel es un servicio de systemd de usuario, así que no necesita root:

```ini
[Unit]
Description=Minecraft Control - local web dashboard

[Service]
ExecStart=/usr/bin/python3 /ruta/al/panel/server.py
Environment=MC_PANEL_HOST=IP_LOCAL_DEL_SERVIDOR
Environment=MC_PANEL_PORT=PUERTO_DEL_PANEL
Environment=MC_PANEL_ALLOWED_SUBNETS=TU_RED_LOCAL/24,127.0.0.0/8
Restart=on-failure
UMask=0077

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now minecraft-panel.service
sudo loginctl enable-linger "$USER"
```

El `enable-linger` es lo que hace que los servicios de usuario arranquen al encender la máquina, sin tener que iniciar sesión.

## Lo que aprendí

> **PENDIENTE:** qué te costó, qué te sorprendió y qué harías distinto. Ideas que salen del código: el límite de memoria de Java en Docker, que las copias no paren el servidor, validar el YAML antes de guardarlo, o cuidar la seguridad de una web que maneja Docker.

## Lo que viene

> **PENDIENTE:** próximos pasos. Por ejemplo: un gestor de plugins de Paper en el panel (ahora solo gestiona mods), restaurar copias desde la web o publicar el panel en GitHub.

Si te interesa montar algo parecido, en otro artículo cuento cómo preparé el [servidor doméstico con Docker, Tailscale y Nextcloud](/posts/servidor-personal-nextcloud-tailscale/) en el que corre todo esto.
