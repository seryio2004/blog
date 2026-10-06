---
title: "De torre vieja a servidor personal: Docker, Grafana, Tailscale y Nextcloud"
section: "Infraestructura"
language: "es"
excerpt: "Cómo convertir una torre vieja en un servidor doméstico con Docker, monitorización centralizada, acceso remoto con Tailscale y Nextcloud sobre dos discos independientes."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-10-06T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

# De torre vieja a servidor personal: Docker, Grafana, Tailscale y Nextcloud

Durante bastante tiempo tuve una torre que hacía poco más que ocupar espacio. No era especialmente potente ni tenía un propósito claro, pero sí tenía algo bastante útil: discos duros, conexión permanente a la red y suficiente hardware como para ejecutar varios servicios sin demasiadas complicaciones.

Así que decidí convertirla en mi servidor personal.

La idea no era montar un *homelab* gigantesco ni llenar Docker de servicios porque sí. Quería algo que realmente me fuese útil en el día a día: centralizar almacenamiento, acceder a mis archivos desde fuera de casa, monitorizar mis equipos, alojar servicios propios y tener una base sobre la que ir desplegando proyectos.

El resultado, de momento, es algo así:

```text
                         ┌─────────────────┐
                         │     Internet    │
                         └────────┬────────┘
                                  │
                              Tailscale
                                  │
                         ┌────────▼────────┐
                         │    sk-server    │
                         │  Ubuntu Server  │
                         └────────┬────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
      Nextcloud               Monitoring               Jellyfin
          │                       │
     PostgreSQL              Prometheus
        + Redis                   │
                                  ▼
                               Grafana
```

Y lo mejor es que todo esto corre en una máquina que ya tenía.

---

## El punto de partida

El servidor corre Ubuntu Server y tiene varios discos con funciones bastante diferenciadas.

La disposición terminó siendo aproximadamente esta:

```text
SSD sistema
└── Ubuntu Server

SSD secundario
└── /srv/docker-projects
    └── proyectos y servicios Docker

HDD interno de 1 TB
└── /srv/storage
    ├── media
    └── nextcloud-hdd

USB Toshiba de 1 TB
└── /mnt/usb
```

Separar el sistema, los contenedores y los datos ha resultado bastante cómodo.

Los contenedores pueden desaparecer, actualizarse o recrearse sin que eso implique tocar directamente los archivos importantes.

---

## Docker como base

La mayoría de servicios del servidor viven en Docker.

Actualmente tengo, entre otros:

```text
Jellyfin
Prometheus
Grafana
Node Exporter
Power Dashboard
Nextcloud
PostgreSQL
Redis
```

Con `docker ps` puedo ver rápidamente qué está funcionando:

```bash
docker ps
```

Y para cada proyecto intento mantener una estructura sencilla:

```text
/srv/docker-projects/apps/
├── nextcloud/
├── monitoring/
├── power-dashboard/
└── ...
```

Cada servicio tiene su propio `compose.yaml`, variables de entorno y configuración.

No es Kubernetes. No hace falta que lo sea.

Para un servidor doméstico, Docker Compose cubre prácticamente todo lo que necesito y hace que reconstruir un servicio sea bastante trivial.

---

## Monitorizar primero, romper después

Una de las primeras cosas que monté fue Prometheus + Grafana.

La idea era sencilla: si iba a tener una máquina encendida permanentemente ejecutando varios servicios, quería saber qué estaba haciendo.

El servidor ejecuta `node-exporter`, que expone métricas como:

- uso de CPU;
- memoria RAM;
- disco;
- red;
- carga del sistema;
- uptime.

Prometheus recoge esas métricas y Grafana se encarga de hacerlas legibles.

```text
Node Exporter
     │
     ▼
 Prometheus
     │
     ▼
   Grafana
```

Después añadí también el portátil y una Raspberry Pi 3B que estoy utilizando para otro proyecto.

En el portátil:

```text
192.168.1.x:9100
```

En la Raspberry:

```text
192.168.1.x:9100
```

Y el Prometheus central del servidor se encarga de consultar todos los equipos.

Para la Raspberry ajusté el intervalo de muestreo a 30 segundos, menos frecuente que uno de 15 segundos:

```yaml
- job_name: "raspberry"
  scrape_interval: 30s
  static_configs:
    - targets:
        - "192.168.1.x:9100"
```

Las IPs son marcadores: cada equipo necesita su propia dirección real. Este bloque va dentro de `scrape_configs` en `prometheus.yml`. Si los equipos están en redes distintas, puedo usar sus direcciones de Tailscale; Prometheus también necesita conectividad con esa red. El puerto 9100 debe ser accesible desde Prometheus.

No necesito saber cada segundo si una Raspberry está usando un 12 % o un 14 % de CPU.

---

### Node Exporter consume sorprendentemente poco

Una de mis dudas era si tenía sentido instalar Node Exporter en una Raspberry Pi 3B.

La respuesta práctica fue sí.

Después de arrancarlo, `systemctl status` mostraba solo unos pocos milisegundos de CPU acumulada tras varios minutos de ejecución.

Ese contador refleja tiempo de CPU acumulado, no un porcentaje instantáneo ni una medición completa del impacto. Para valorar el consumo conviene observar también la memoria y las métricas durante una carga real.

Para comprobar qué procesos estaban consumiendo realmente recursos podía usar:

```bash
ps aux --sort=-%cpu | head -15
```

o directamente:

```bash
htop
```

Esto es especialmente útil en la Raspberry porque va a terminar ejecutando mi sampler y quiero saber hasta dónde puedo apretar el hardware antes de que el audio empiece a sufrir.

---

## Acceso remoto con Tailscale

El siguiente problema era evidente.

Todo funcionaba perfectamente dentro de casa, pero quería poder acceder al servidor desde cualquier sitio sin empezar a abrir puertos del router.

Aquí entró Tailscale.

La instalación en Ubuntu es bastante directa:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Después de autenticar el dispositivo, el servidor obtiene una IP privada dentro de la red Tailscale.

A partir de ahí puedo hacer:

```bash
ssh server
```

desde el portátil incluso estando fuera de casa.

El alias vive en:

```text
~/.ssh/config
```

Por ejemplo:

```sshconfig
Host server
    HostName 100.x.x.x
    User sk
```

Lo mismo para la Raspberry:

```sshconfig
Host raspberry
    HostName 100.x.y.z
    User sk
```

Las direcciones `100.x.x.x` y `100.x.y.z` son ejemplos: hay que sustituirlas por las IPs reales de cada equipo en Tailscale. Un nombre como `sampler.local` normalmente se resuelve mediante mDNS en la red local; para acceder desde fuera utilizo la IP de Tailscale o un nombre de MagicDNS.

Esto parece una tontería hasta que dejas de escribir IPs todo el rato.

---

## Montando mi propio Drive con Nextcloud

Con el acceso remoto resuelto, el siguiente paso tenía bastante sentido: utilizar el servidor como almacenamiento personal.

Para eso monté Nextcloud.

La arquitectura elegida fue:

```text
Nextcloud
├── PostgreSQL
├── Redis
├── HDD interno
└── USB externo
```

PostgreSQL se utiliza como base de datos y Redis para caché y bloqueo de archivos.

Todo vive dentro de Docker excepto los datos reales.

---

### Dos almacenamientos, no un RAID improvisado

Aquí tenía una decisión importante.

El servidor tiene un HDD interno con bastante espacio y además un disco USB de 1 TB que ya contenía datos.

No quería unirlos.

Tampoco quería que uno fuese simplemente copia de seguridad del otro.

Quería dos almacenamientos completamente independientes dentro de Nextcloud.

Así quedó:

```text
Nextcloud

Archivos principales
└── /srv/storage/nextcloud-hdd

USB
└── /mnt/usb
```

El HDD interno funciona como almacenamiento principal de la cuenta.

El USB aparece dentro de Nextcloud como un almacenamiento externo separado.

Eso permite decidir dónde guardar cada cosa sin mezclar físicamente los discos.

---

## El `compose.yaml`

La pila de Nextcloud terminó siendo bastante clásica. Esta es una base de ejemplo para una instalación nueva con la misma distribución de discos; hay que adaptar rutas, credenciales y nombres a cada máquina:

```yaml
services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD}
    volumes:
      - nextcloud_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud -d nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: nextcloud:34-apache
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment: &nextcloud_environment
      POSTGRES_HOST: db
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD}
      REDIS_HOST: redis
      NEXTCLOUD_TRUSTED_DOMAINS: ${NEXTCLOUD_TRUSTED_DOMAINS:-localhost}
    volumes: &nextcloud_volumes
      - nextcloud_html:/var/www/html
      - /srv/storage/nextcloud-hdd:/var/www/html/data
      - /mnt/usb:/mnt/usb

  cron:
    image: nextcloud:34-apache
    restart: unless-stopped
    entrypoint: /cron.sh
    depends_on:
      app:
        condition: service_started
    environment: *nextcloud_environment
    volumes: *nextcloud_volumes

volumes:
  nextcloud_db:
  nextcloud_html:
```

Junto al `compose.yaml`, el archivo `.env` necesita estos valores:

```dotenv
POSTGRES_PASSWORD=REEMPLAZAR_POR_UNA_CONTRASENA_LARGA_Y_UNICA
NEXTCLOUD_TRUSTED_DOMAINS=localhost
```

No guardo `.env` en Git. Las variables de PostgreSQL inicializan una base de datos nueva; cambiar después la contraseña en `.env` no cambia automáticamente la del usuario dentro de una base ya creada.

`app` y `cron` comparten los mismos volúmenes y la misma imagen. En Nextcloud hay que seleccionar **Cron** en los ajustes de trabajos en segundo plano; el contenedor se encarga de ejecutarlos. Para un despliegue reproducible conviene fijar la versión de parche o el digest y actualizar ambos servicios juntos, siguiendo la ruta de actualización compatible. La [documentación de la imagen de Nextcloud](https://hub.docker.com/_/nextcloud) explica las variables y los volúmenes; sus [ejemplos de Compose](https://github.com/nextcloud/docker/tree/master/.examples/docker-compose) incluyen el servicio de cron.

Antes de arrancar, compruebo que los discos están montados y que el directorio principal de datos tiene permisos para `www-data` dentro del contenedor:

```bash
findmnt /srv/storage
findmnt /mnt/usb
ls -ld /srv/storage/nextcloud-hdd
docker compose config --quiet
docker compose up -d db redis app
docker compose exec -u www-data app php occ status
```

Completo el asistente inicial a través del navegador y, una vez instalada la aplicación, arranco cron y reviso los logs:

```bash
docker compose up -d cron
docker compose ps
docker compose logs --tail=100 app cron
```

En este ejemplo el puerto 8080 solo escucha en el servidor. Desde el portátil puedo abrir un túnel SSH sobre la conexión de Tailscale:

```bash
ssh -N -L 8080:127.0.0.1:8080 server
```

Mientras esa sesión esté abierta, entro en `http://localhost:8080` desde el portátil. Para acceder directamente desde el móvil o un cliente de sincronización, una opción es configurar [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve) con HTTPS dentro de la red privada. En ese caso también hay que ajustar el dominio de confianza y la configuración de proxy de Nextcloud. Publicar `8080:80` sin una IP concreta haría que Docker escuchase en todas las interfaces del host.

De esta forma:

```text
Docker
│
├── configuración de Nextcloud
│
├── PostgreSQL
│
└── Redis

Host
│
├── HDD → datos principales
└── USB → almacenamiento externo
```

---

## El USB y el pequeño infierno de FAT32

El USB ya tenía años de archivos y estaba formateado en FAT32.

Eso significaba que no quería reformatearlo.

También significaba que los permisos Linux no funcionaban exactamente como en ext4.

El disco estaba montado originalmente así:

```text
uid=1000
gid=1000
fmask=0022
dmask=0022
```

Eso permitía que mi usuario escribiese, pero Nextcloud —que trabaja como `www-data`— no podía hacerlo.

La solución fue montar FAT32 asignando el grupo `www-data`:

```text
uid=1000
gid=33
fmask=0113
dmask=0002
```

En `/etc/fstab`:

```fstab
UUID=XXXX-XXXX /mnt/usb vfat uid=1000,gid=33,fmask=0113,dmask=0002,iocharset=utf8,nofail 0 0
```

Con eso:

```text
sk        → lectura/escritura
www-data  → lectura/escritura
```

En FAT32 los permisos se asignan al montar: `chown` y `chmod` no funcionan como en ext4. Con esas máscaras, los archivos quedan en `0664` y los directorios en `0775`. Los valores `1000` y `33` corresponden a mi usuario y a `www-data` en esta instalación; conviene comprobarlos antes de copiarlos:

```bash
id sk
getent group www-data
docker compose exec app id www-data
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/usb
```

Y pude comprobarlo directamente:

```bash
sudo -u www-data touch /mnt/usb/.nextcloud-test
sudo rm /mnt/usb/.nextcloud-test
docker compose exec -u www-data app sh -c \
  'touch /mnt/usb/.nextcloud-container-test && rm /mnt/usb/.nextcloud-container-test'
```

La segunda prueba verifica también el acceso desde el contenedor. Si cambio las opciones de `/etc/fstab`, tengo que detener `app` y `cron` antes de desmontar y volver a montar el USB, y recrear ambos contenedores después. Editar el archivo por sí solo no cambia el montaje activo.

`nofail` permite que Ubuntu arranque sin ese disco, pero no impide que Docker use el directorio vacío situado debajo del punto de montaje. Antes de iniciar Nextcloud hay que comprobar el montaje y, para automatizarlo, hacer que el arranque de la pila dependa de los discos necesarios.

FAT32 también limita cada archivo a menos de 4 GiB. Subir los límites de PHP o de Nextcloud no elimina esa restricción del disco.

---

## El bug que parecía de Nextcloud y no era de Nextcloud

Después de añadir el USB como almacenamiento externo, Nextcloud lo mostraba como:

```text
Pendiente
```

Al intentar abrirlo, simplemente no funcionaba.

Los permisos estaban bien.

Docker veía el disco.

`www-data` podía crear archivos.

Así que tocaba mirar logs.

El error importante era:

```text
invalid byte sequence for encoding "UTF8": 0xba
```

Y aparecía intentando indexar una carpeta llamada:

```text
1\xBA informatica
```

Ahí estaba el problema.

El disco contenía una carpeta cuyo nombre utilizaba el carácter `º`, pero FAT32 lo estaba exponiendo con una codificación que PostgreSQL no podía aceptar como UTF-8 válido.

Con:

```bash
LC_ALL=C ls -lb /mnt/usb
```

se veía:

```text
1\272\ informatica
```

Ese `\272` corresponde al byte `0xBA`.

Después de montar el disco con:

```text
iocharset=utf8
```

el nombre empezó a llegar correctamente como UTF-8 y Nextcloud pudo indexar el almacenamiento.

Ese fue el ajuste que resolvió mi caso. En VFAT también existe la opción `utf8` y conviene revisar las opciones admitidas por el sistema antes de generalizar esta línea de `fstab`; el [manual de `mount`](https://man7.org/linux/man-pages/man8/mount.8.html) describe cómo se convierten los nombres. No hacía falta cambiar la codificación de PostgreSQL ni renombrar archivos a ciegas.

Este tipo de problemas son probablemente la mejor definición posible de administrar un servidor casero:

> todo funciona excepto una carpeta creada hace tres años desde otro sistema operativo.

---

## Añadiendo el USB a Nextcloud

Una vez resueltos permisos y codificación, solo quedaba activar el soporte de almacenamiento externo:

```bash
docker compose exec -u www-data app \
  php occ app:enable files_external
```

Y desde la interfaz:

```text
Administración
→ Almacenamiento externo
```

Configuración:

```text
Nombre:           USB
Tipo:             Local
Ruta:             /mnt/usb
Autenticación:    Ninguna
```

Un montaje configurado por el administrador está disponible para todos los usuarios por defecto. En una instancia con más cuentas puedo limitarlo a usuarios o grupos concretos desde el campo de disponibilidad, como explica la [documentación de almacenamiento externo](https://docs.nextcloud.com/server/stable/admin_manual/configuration_files/external_storage_configuration_gui.html).

Después de eso, Nextcloud muestra directamente los archivos que ya existían en el disco.

No se copian.

No se duplican.

Nextcloud simplemente accede al mismo `/mnt/usb`.

Si modifico archivos del USB fuera de Nextcloud, puede hacer falta actualizar su índice. Puedo lanzar un escaneo para mi usuario:

```bash
docker compose exec -u www-data app php occ files:scan USUARIO_NEXTCLOUD
```

`USUARIO_NEXTCLOUD` es el identificador de la cuenta, no el usuario Linux. En cambio, el directorio principal `/var/www/html/data` lo gestiona Nextcloud: no lo uso como una carpeta compartida para copiar y borrar archivos por mi cuenta.

---

## Dos discos no son una copia de seguridad

Separar el HDD y el USB me da dos destinos, pero no protege por sí solo frente a un disco averiado, un borrado accidental o un fallo del servidor. La sincronización tampoco sustituye a una copia: puede propagar un borrado a otros dispositivos.

Todavía tengo pendiente automatizar un sistema de backup. Para Nextcloud debe cubrir la base de datos, los datos principales, la configuración y las aplicaciones o temas propios, además de los archivos del USB que quiera conservar. La [guía de copias de seguridad de Nextcloud](https://docs.nextcloud.com/server/stable/admin_manual/maintenance/backup.html) detalla esos elementos y el uso del modo de mantenimiento para evitar inconsistencias.

Quiero guardar al menos una copia fuera de esta máquina y comprobar que puedo restaurarla. Tener un volumen persistente me permite recrear un contenedor; recuperar una instalación completa exige conservar también sus datos y su base de datos.

---

## Qué puedo hacer ahora con el servidor

A estas alturas la torre ya no es simplemente "un PC viejo encendido".

Actualmente funciona como varias cosas a la vez.

### Nube personal

Nextcloud me permite almacenar y acceder a archivos desde cualquier dispositivo.

El HDD interno sirve como almacenamiento principal y el USB como segundo almacenamiento independiente.

### Servidor multimedia

Jellyfin utiliza el almacenamiento del servidor para servir contenido multimedia a otros dispositivos de la red.

### Monitorización centralizada

Grafana me permite ver en un único sitio:

```text
Servidor
Portátil
Raspberry Pi
```

con métricas de CPU, RAM, discos, red y carga.

### Acceso remoto

Tailscale hace posible entrar al servidor desde fuera de casa sin depender de estar conectado a mi Wi-Fi.

### Plataforma para proyectos

También puedo utilizarlo para desplegar mis propias aplicaciones.

Un ejemplo es `power-dashboard`, que ya corre como otro contenedor Docker.

También tengo pensado desplegar webs personales con sus propias bases de datos alojadas en el servidor. La idea es aprovechar esta infraestructura para desarrollar y mantener mis proyectos, tanto las aplicaciones como sus datos.

Para publicarlas bajo mis propios dominios, tengo previsto utilizar Cloudflare Tunnel. Así, las webs que quiera hacer públicas tendrán su propio dominio, mientras seguiré utilizando Tailscale para acceder al servidor de forma privada.

Uno de esos proyectos será una web específica de entrenamientos. Más adelante escribiré un artículo dedicado a ella, en el que contaré con más detalle en qué consiste y cómo la he montado y desplegado.

---

## Lo interesante no es Nextcloud

Después de montar todo esto, lo que más me interesa no es realmente tener "mi propio Google Drive".

Lo interesante es tener una infraestructura propia.

Algo como:

```text
                        sk-server
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      servicios         proyectos         datos
          │                 │                 │
     Nextcloud          aplicaciones         HDD
     Jellyfin              propias           USB
     Grafana
     Prometheus
          │
          └────────── observabilidad
```

Cada nuevo proyecto puede aprovechar lo que ya existe.

Si una aplicación necesita desplegarse, Docker ya está ahí.

Si quiero saber cuánto consume, Prometheus ya está ahí.

Si quiero acceder desde fuera, Tailscale ya está ahí.

Si necesita almacenamiento, ya tengo una estructura preparada.

Ese es probablemente el cambio más importante.

He pasado de tener varios ordenadores independientes a tener una pequeña infraestructura doméstica.

---

## Qué queda por hacer

Todavía hay bastante margen para seguir complicándolo innecesariamente.

Algunas de las siguientes cosas que probablemente termine añadiendo son:

- HTTPS para los servicios internos;
- un reverse proxy para dejar de recordar puertos;
- nombres DNS locales;
- cAdvisor para monitorizar contenedores individualmente;
- Loki para centralizar logs;
- Uptime Kuma para saber rápidamente qué servicios están caídos;
- Forgejo para repositorios Git internos;
- algún sistema serio de backup.

Porque, evidentemente, tener un servidor doméstico nunca consiste en terminarlo.

Consiste en encontrar la siguiente cosa que todavía no estás monitorizando.

---

## Estado actual

Por ahora la infraestructura queda así:

```text
Tailscale
└── sk-server (Ubuntu Server)
    ├── Nextcloud
    │   ├── PostgreSQL
    │   ├── Redis
    │   ├── HDD → datos principales
    │   └── USB → almacenamiento externo
    ├── Prometheus → Grafana
    │   └── Node Exporter: servidor, portátil y Raspberry Pi
    └── Jellyfin
```

No es un datacenter.

Pero ya empieza a parecer demasiado serio para seguir llamándolo "la torre vieja".
