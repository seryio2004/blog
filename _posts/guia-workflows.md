---
title: "Forgejo de principio a fin: runners, CI/CD y paquetes"
section: "Forgejo"
language: "es"
excerpt: "Una guía completa para preparar runners, automatizar pruebas y publicar paquetes reutilizables en Forgejo, con procesos y ejemplos adaptables."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-27T05:35:07.322Z"
updatedDate: "2026-10-12T00:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

Guardar código en un repositorio es solo una parte del trabajo. También necesitamos comprobar los cambios, preparar un entorno donde ejecutarlos y distribuir versiones que otros proyectos puedan instalar.

Forgejo permite conectar esas tareas mediante Actions y su registro de paquetes. El recorrido empieza con un runner disponible, continúa con un workflow que valida el repositorio y termina con una versión publicada. Entender qué responsabilidad tiene cada pieza hace que la configuración resulte más fácil de mantener.

Esta guía describe ese proceso sin depender de una máquina ya preparada ni de otro proyecto que sirva de plantilla. Los ejemplos usan Python, pero la secuencia se puede aplicar a otros lenguajes cambiando las herramientas de instalación, pruebas y empaquetado. El dominio `forgejo.example.com`, el propietario `OWNER` y los nombres de paquetes son valores de ejemplo.

## Cómo encajan las piezas

Un **runner** ejecuta los trabajos que Forgejo le asigna. Un **workflow** describe cuándo se ejecutan y qué deben hacer. El **registro de paquetes** conserva los artefactos publicados para que otros proyectos puedan descargarlos.

```text
Cambio en el repositorio
  → evento de Actions
  → workflow
  → runner disponible
  → instalación de dependencias y pruebas
  → construcción de una versión
  → publicación en el registro
  → instalación desde otro proyecto
```

Las pruebas pueden ejecutarse con cada propuesta de cambio. La publicación necesita un momento explícito: una etiqueta de versión, una release o una ejecución manual autorizada. Así, probar una rama no implica publicar automáticamente sus paquetes.

## Preparar el entorno de ejecución

Antes de escribir el workflow, comprueba que Actions está habilitado en la instancia y en el repositorio, y que la máquina del runner puede acceder a Forgejo, a las imágenes de contenedor y a los índices de dependencias que va a utilizar.

El runner puede instalarse como servicio o ejecutarse en un contenedor. Elige el método que puedas mantener y usa la configuración generada para la versión instalada. Si partes de una configuración existente, reutiliza su estructura y revisa las rutas, los volúmenes y las credenciales antes de arrancarla.

### Comprobar los requisitos antes de empezar

El ejemplo de despliegue de esta guía utiliza un host Linux con Docker Engine y el plugin de Compose. El usuario que ejecuta los comandos debe poder usar Docker y crear el directorio de trabajo. Si Docker aún no está instalado, sigue la [instalación oficial para tu distribución](https://docs.docker.com/engine/install/); el runner no instala el motor por ti.

Comprueba primero las herramientas y la conexión:

```bash
docker version
docker compose version
curl --fail --silent --show-error https://forgejo.example.com/ >/dev/null
```

`docker version` debe mostrar cliente y servidor. Si solo aparece el cliente o hay un error de permisos, resuelve el acceso al daemon antes de continuar. La petición HTTPS comprueba el host; después habrá que repetirla dentro de los contenedores.

En el servidor de Forgejo, un administrador puede habilitar Actions en `app.ini`:

```ini
[actions]
ENABLED = true
```

Aplica el cambio reiniciando el servicio de Forgejo según su método de despliegue. En los ajustes del repositorio, entra en la configuración de unidades y habilita Actions. Si la opción no aparece, revisa la configuración de la instancia. Son dos niveles de configuración que conviene comprobar por separado.

### Crear el directorio y generar la configuración

Prepara el directorio con permisos para el usuario que va a editar los archivos:

```bash
sudo mkdir -p /srv/ci/proyecto/config /srv/ci/proyecto/state /srv/ci/proyecto/test-data
sudo chown "$(id -u):$(id -g)" /srv/ci/proyecto /srv/ci/proyecto/config
cd /srv/ci/proyecto

docker run --rm data.forgejo.org/forgejo/runner:13 \
  forgejo-runner generate-config > config/runner.yml
```

El ejemplo usa la serie 13 del runner. La versión del runner tiene su propio ciclo de publicación y no tiene por qué coincidir con el número de versión de Forgejo. Verifica la compatibilidad para tu instalación y utiliza la misma imagen al generar la configuración y al ejecutar el servicio. Puedes fijar una versión exacta o un digest una vez validado el despliegue.

Abre `config/runner.yml` y modifica los bloques descritos a continuación. Los fragmentos de esta guía se integran en el archivo generado: si ya existe una clave `runner`, `server` o `container`, edita su contenido en lugar de añadir otra clave igual. Conserva los demás valores y comentarios hasta saber qué necesitas cambiar.

### Registrar el runner

Elige el alcance del runner: un repositorio, un usuario, una organización o toda la instancia. Un runner compartido evita repetir instalaciones; uno dedicado permite separar recursos y permisos.

Desde los ajustes de Actions del alcance elegido, crea el runner y guarda los datos de conexión que muestra Forgejo. En las versiones que utilizan registro interactivo, el bloque se incorpora bajo `server.connections`:

```yaml
server:
  connections:
    principal:
      url: https://forgejo.example.com/
      uuid: "UUID_DEL_RUNNER"
      token: "TOKEN_DEL_RUNNER"
```

El token identifica al runner. Guárdalo fuera del repositorio y limita el acceso al archivo. El mecanismo de registro depende de las versiones del servidor y del runner; consulta la [documentación de registro](https://forgejo.org/docs/latest/admin/actions/registration/) correspondiente a tu instalación.

Para un runner de repositorio, la ruta habitual es **Ajustes → Actions → Runners → Crear nuevo runner**. Ponle un nombre que identifique su función, como `ci-proyecto`, y copia la URL, el UUID y el token al bloque generado. La URL debe ser accesible desde el contenedor del runner; `localhost` apuntaría a ese contenedor, no al servidor de Forgejo.

El registro en la interfaz crea la identidad del runner, pero todavía falta arrancar el proceso que se conecta con ella. Si el runner aparece desconectado en este punto, es normal. Si tienes que sustituirlo, registra una identidad nueva o rota sus credenciales siguiendo el procedimiento de tu versión.

### Elegir una etiqueta y una imagen

El workflow selecciona el entorno mediante una etiqueta. Este fragmento de configuración declara `ci`, asociado a una imagen de ejemplo:

```yaml
runner:
  labels:
    - "ci:docker://docker.io/library/node:22-bookworm"
```

Un trabajo con `runs-on: ci` podrá ejecutarse en ese entorno. La imagen debe contener las herramientas que necesitan las acciones: muchas acciones reutilizables usan Node.js, aunque el proyecto probado esté escrito en Python. Consulta la [configuración de etiquetas e imágenes](https://forgejo.org/docs/latest/admin/actions/configuration/) y fija las versiones o los digests que hayas validado.

### Separar configuración, estado y datos

Una organización posible del host es:

```text
/srv/ci/proyecto/
├── compose.yml
├── config/
│   └── runner.yml
├── state/
└── test-data/
```

`config` contiene la configuración; `state`, el estado persistente que necesita el despliegue; y `test-data`, los archivos externos que requieren las pruebas. Estas carpetas tienen funciones distintas y pueden tener permisos distintos.

### Desplegar el runner con Compose

En este ejemplo, el runner y el motor que crea los contenedores de los jobs son servicios diferentes. `engine` ejecuta Docker-in-Docker; `runner` consulta Forgejo y le pide a ese motor que lance cada trabajo. Esto permite mantener el estado de Docker en un volumen propio.

Guarda el siguiente archivo como `/srv/ci/proyecto/compose.yml`:

```yaml
services:
  engine:
    image: docker:27-dind
    privileged: true
    environment:
      DOCKER_TLS_CERTDIR: ""
    command: ["dockerd", "-H", "tcp://0.0.0.0:2375", "--tls=false"]
    volumes:
      - engine-data:/var/lib/docker
    healthcheck:
      test: ["CMD", "docker", "info"]
      interval: 10s
      timeout: 5s
      retries: 12
    restart: unless-stopped

  runner:
    image: data.forgejo.org/forgejo/runner:13
    working_dir: /data
    environment:
      DOCKER_HOST: tcp://engine:2375
    volumes:
      - ./config/runner.yml:/etc/runner.yml:ro
      - ./state:/data
    depends_on:
      engine:
        condition: service_healthy
    command: ["forgejo-runner", "daemon", "--config", "/etc/runner.yml"]
    restart: unless-stopped

volumes:
  engine-data:
```

El nombre `engine` se resuelve dentro de la red de Compose. `DOCKER_HOST` conecta el runner con ese servicio, y el chequeo de salud retrasa su arranque hasta que el motor responde. La imagen del runner, la imagen de Docker-in-Docker y la imagen de los jobs cumplen funciones distintas: cambiar una no actualiza automáticamente las otras.

El ejemplo sigue el patrón de la [instalación de Forgejo Runner con Docker](https://forgejo.org/docs/latest/admin/actions/installation/docker/). El daemon usa TCP sin TLS dentro de la red del despliegue y el contenedor de Docker-in-Docker necesita privilegios. No publiques el puerto 2375 ni conectes servicios ajenos a esa red: el acceso al daemon permite controlar sus contenedores. Para trabajos de terceros, prepara un entorno dedicado con el aislamiento adecuado.

La imagen del runner se ejecuta con un usuario sin privilegios. Comprueba su identidad y asigna a ese usuario los archivos que necesita:

```bash
RUNNER_UID=$(docker run --rm data.forgejo.org/forgejo/runner:13 id -u)
RUNNER_GID=$(docker run --rm data.forgejo.org/forgejo/runner:13 id -g)
sudo chown -R "$RUNNER_UID:$RUNNER_GID" state
sudo chown "$RUNNER_UID:$RUNNER_GID" config/runner.yml
sudo chmod 600 config/runner.yml

docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 runner
```

`state` debe ser escribible y `config/runner.yml`, legible para ese usuario. Tras cambiar el propietario, puede que necesites `sudoedit config/runner.yml` para editarlo. El montaje de configuración es de solo lectura dentro del contenedor; su estado se escribe bajo `/data`.

Comprueba que el servicio `engine` está sano y que Forgejo muestra el runner conectado. Si modificas `runner.yml`, reinicia el runner para que lea el cambio:

```bash
docker compose restart runner
```

Si cambias el archivo Compose, aplica la nueva definición con `docker compose up -d`. Para detener los servicios, usa `docker compose down`; conserva el volumen de Docker cuando quieras mantener imágenes y estado. Añadir `--volumes` también elimina el volumen declarado en este despliegue.

Para añadir otro proyecto, asigna nombres y rutas propios a los recursos que deban estar separados. No copies el token de otro runner. Tampoco es necesario crear un runner nuevo por cada repositorio si el alcance del existente ya lo incluye.

Si las pruebas necesitan datos externos, cópialos al host o descárgalos durante el trabajo. Por ejemplo:

```bash
rsync -avh --progress ./test-data/ usuario@HOST:/srv/ci/proyecto/test-data/
```

En una ejecución con Docker-in-Docker, la ruta de un montaje debe existir donde corre el daemon que crea los contenedores del trabajo. Monta los datos en modo de solo lectura cuando las pruebas no necesiten modificarlos, y ajusta CPU, memoria y tiempo máximo según la carga.

### Montar datos de pruebas donde los necesita el job

En el despliegue anterior, los jobs los crea `engine`. Por eso, un montaje definido para el runner no basta para que el motor encuentre los archivos. Hay dos pasos: exponer los datos al contenedor de Docker-in-Docker y pedirle que los monte en los jobs.

Añade esta entrada a la lista `volumes` del servicio `engine` en Compose:

```yaml
- ./test-data:/test-data:ro
```

Después, integra este fragmento en el bloque `container` de `config/runner.yml`:

```yaml
container:
  options: >-
    --volume /test-data:/test-data:ro
    --memory=4g
    --cpus=2
    --pids-limit=256
  valid_volumes:
    - /test-data
```

La primera ruta de `--volume` es la que ve el daemon dentro de `engine`; la segunda es la que verá el job. `valid_volumes` limita qué montajes pueden solicitar los workflows. No amplíes la lista a todo el host para resolver un error de ruta.

Aplica Compose y reinicia el runner. Desde un paso del workflow, comprueba el contenido con `ls -lah /test-data` antes de ejecutar las pruebas. Si necesitan escribir, usa una carpeta temporal de trabajo y copia allí los archivos de entrada. Los límites de este ejemplo se aplican al contenedor del job; revisa también la capacidad de concurrencia del runner para no lanzar más trabajos de los que soporta el host.

### Hacer una primera prueba de conexión

Antes de añadir instalación de dependencias y pruebas, guarda `.forgejo/workflows/smoke.yml` con este contenido:

```yaml
name: Comprobar runner
on:
  workflow_dispatch:

jobs:
  smoke:
    runs-on: ci
    steps:
      - run: |
          id
          node --version
          git --version
          curl --fail --silent --show-error https://forgejo.example.com/ >/dev/null
```

Sube el archivo a la rama principal, abre Actions y ejecuta el workflow manualmente. Si utilizas una CA interna, prepara primero la confianza del contenedor como se explica en la sección de certificados. Este trabajo separa los problemas de asignación, imagen y conectividad de los problemas del proyecto.

La ejecución debe mostrar la identidad del usuario y las versiones de Node.js y Git, y completar la petición HTTPS. Si permanece pendiente, todavía hay que revisar el alcance o la etiqueta del runner. Si arranca pero un comando no existe, el problema está en la imagen del job.

## Describir el trabajo en un workflow

Los workflows se guardan en `.forgejo/workflows/`. Un archivo YAML contiene tres niveles: eventos que activan la ejecución, trabajos (*jobs*) que se asignan a runners y pasos (*steps*) que se ejecutan en orden dentro de cada trabajo.

Forgejo Actions utiliza una sintaxis cercana a GitHub Actions, aunque conviene comprobar la compatibilidad de cada acción y función. La [guía de inicio de Actions](https://forgejo.org/docs/latest/user/actions/quick-start/) explica cómo habilitarlo y ejecutar el primer workflow.

### Preparar un proyecto Python que pueda probarse y empaquetarse

El workflow necesita un proyecto instalable. Una estructura mínima separa el código del paquete, las pruebas y la automatización:

```text
proyecto/
├── pyproject.toml
├── uv.lock
├── src/
│   └── example_package/
│       └── __init__.py
├── tests/
│   └── test_example.py
└── .forgejo/
    └── workflows/
        └── tests.yml
```

`example-package` es el nombre de distribución que utilizará el registro; `example_package` es el módulo que importará Python. El directorio `src` evita que una prueba encuentre accidentalmente el código solo por estar en la raíz del repositorio.

Este `pyproject.toml` completo define un paquete sencillo con setuptools:

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "example-package"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[dependency-groups]
dev = ["pytest>=8,<9"]

[tool.setuptools.packages.find]
where = ["src"]
```

En `src/example_package/__init__.py`, añade una función mínima:

```python
def add(left: int, right: int) -> int:
    return left + right
```

Y en `tests/test_example.py`, una prueba que compruebe su comportamiento:

```python
from example_package import add


def test_add():
    assert add(2, 3) == 5
```

Con uv instalado en tu equipo, resuelve el entorno y ejecuta las pruebas antes de subir el workflow:

```bash
uv lock
uv sync --locked
uv run --locked pytest
```

Confirma `pyproject.toml`, `uv.lock`, el código y las pruebas en Git. Añade `.venv/`, `.venv-publish/`, `dist/`, `build/` y `*.egg-info/` al `.gitignore`. El grupo `dev` contiene herramientas de desarrollo y uv lo instala por defecto; un extra en `project.optional-dependencies` representa una función opcional del paquete, como veremos después. La [guía de empaquetado de Python](https://packaging.python.org/en/latest/tutorials/packaging-projects/) explica los campos y el backend de construcción.

### Un ejemplo de pruebas

Este ejemplo supone un proyecto con `pyproject.toml`, un `uv.lock` confirmado en Git y `pytest` declarado entre sus dependencias de desarrollo. La etiqueta `ci` debe existir en el runner, y su imagen debe permitir ejecutar checkout e instalar las herramientas de Python.

Guárdalo como `.forgejo/workflows/tests.yml`:

```yaml
name: Pruebas

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  tests:
    name: Validar el proyecto
    runs-on: ci
    timeout-minutes: 30

    steps:
      - name: Descargar el código
        uses: https://data.forgejo.org/actions/checkout@v4
        with:
          persist-credentials: false

      - name: Instalar herramientas
        shell: bash
        run: |
          set -euo pipefail
          apt-get update
          apt-get install -y --no-install-recommends python3 python3-venv python3-pip
          python3 -m venv /tmp/ci-tools
          /tmp/ci-tools/bin/python -m pip install uv
          /tmp/ci-tools/bin/uv --version

      - name: Instalar dependencias
        run: /tmp/ci-tools/bin/uv sync --locked

      - name: Ejecutar pruebas
        run: /tmp/ci-tools/bin/uv run --locked pytest
```

El ejemplo instala herramientas en una imagen Debian ejecutada con permisos suficientes para usar `apt-get`. Para un entorno estable, prepara una imagen de CI con las versiones de herramientas ya fijadas y sustituye ese paso por una comprobación de disponibilidad. La URL completa de checkout deja claro de dónde se obtiene la acción; para fijar exactamente su contenido, usa un commit revisado.

### Entender qué conserva cada paso

Los pasos de un job comparten su entorno de trabajo, pero cada `run` abre un proceso de shell nuevo. Los archivos creados por un paso siguen disponibles en el siguiente; un `export` ejecutado dentro de esa shell no configura por sí solo los pasos posteriores. Usa `env` en el job o en el paso correspondiente para proporcionar variables.

Por eso el ejemplo llama a uv mediante `/tmp/ci-tools/bin/uv` en cada paso. El entorno `/tmp/ci-tools` contiene las herramientas de automatización; `.venv`, creado por uv en el repositorio, contiene el proyecto y sus dependencias. Son dos entornos con funciones distintas.

`uv sync --locked` exige que el lockfile esté actualizado y falla si necesita modificarlo. Corrige esa situación en local con `uv lock`, revisa el cambio y confirma el archivo antes de repetir CI. `uv run --locked pytest` usa el entorno del proyecto, y una prueba fallida interrumpe el job antes de que llegue a una posible publicación.

Si las pruebas necesitan generar datos o levantar recursos propios, añade un paso entre la instalación y pytest. Ese paso debe comprobar sus entradas y devolver un error si no puede prepararlas. No uses `continue-on-error` para ocultar un fallo de preparación del que dependen las pruebas.

### Ajustar eventos, trabajos y pasos

`push` valida los cambios que llegan a `main`; `pull_request` comprueba las propuestas antes de integrarlas; y `workflow_dispatch` permite lanzar la ejecución manualmente. Cambia `main` por la rama principal del proyecto.

Los filtros de ramas y rutas permiten ajustar cuándo se ejecuta el trabajo. Por ejemplo, dentro de `push` puedes añadir `paths-ignore: ["docs/**"]` si los cambios de documentación no requieren estas pruebas. Revisa los filtros para que sigan cubriendo los cambios que afectan al proyecto.

Cada job tiene un identificador, una etiqueta en `runs-on` y un límite de tiempo. Si separas pruebas y publicación en distintos jobs, usa `needs: tests` en el de publicación para exigir que las pruebas hayan terminado correctamente. Los archivos creados en un job no se transfieren automáticamente a otro: reconstruye desde el mismo commit o transfiere los artefactos de forma explícita.

Dentro de un job, `uses` invoca una acción y `with` configura sus entradas. `run` ejecuta comandos; `env` proporciona variables; `working-directory` cambia el directorio de ejecución; y `shell` selecciona el intérprete.

Las pruebas deben devolver un código de salida distinto de cero cuando fallen. Si el proyecto usa scripts propios, concentra su descubrimiento y ejecución en un comando del repositorio. Así podrás ejecutarlo también en local y añadir pruebas sin modificar el workflow.

## Acceder a recursos privados

Las credenciales para descargar código o paquetes se guardan como secretos de Actions. Expón cada secreto únicamente al paso que lo necesita. Distingue las credenciales de lectura de dependencias de las que permiten publicar versiones.

Para un checkout por SSH, proporciona una clave con acceso al repositorio y los hosts conocidos verificados mediante las entradas `ssh-key` y `ssh-known-hosts` de la acción. Si el checkout habitual ya funciona con la autenticación del trabajo, no necesitas añadir ese acceso.

Cuando la instancia utiliza una autoridad certificadora interna, instala su certificado en los entornos que establecen la conexión: el runner, el contenedor del trabajo y las herramientas de publicación pueden tener almacenes de confianza diferentes. En Debian o Ubuntu, el proceso habitual es guardar el certificado CA con extensión `.crt` en `/usr/local/share/ca-certificates/` y ejecutar `update-ca-certificates`.

Usa un certificado obtenido de una fuente de confianza y conserva la verificación TLS. Para uv puedes seleccionar el almacén del sistema con `UV_SYSTEM_CERTS=true`; Twine permite indicar un archivo de certificados mediante `TWINE_CERT`.

Los trabajos que procesan contribuciones externas requieren especial cuidado con los permisos. Mantén la publicación en un contexto de confianza, separado de la ejecución de código que aún no se ha revisado.

### Crear y asignar los secretos

En los ajustes del repositorio, abre **Actions → Secrets** y crea los secretos que realmente utilice el workflow. Los nombres de esta guía tienen responsabilidades concretas:

- `PACKAGE_READ_USERNAME` y `PACKAGE_READ_TOKEN`: cuenta y token para descargar dependencias privadas.
- `PACKAGE_PUBLISH_USERNAME` y `PACKAGE_PUBLISH_TOKEN`: cuenta y token para subir versiones al registro.
- `INTERNAL_CA_CERT`: certificado público de la CA interna en formato PEM, si la instancia lo necesita.
- `SSH_PRIVATE_KEY` y `SSH_KNOWN_HOSTS`: acceso SSH y hosts verificados, si eliges ese método para checkout.

El token del runner pertenece a su configuración en el host y no sustituye ninguno de esos secretos. Del mismo modo, el token automático de un workflow no debe darse por válido para cualquier registro privado: comprueba qué recurso necesita acceder y con qué permisos.

Para tokens personales, revisa el alcance de paquetes: `read:package` para lectura y `write:package` para publicación, además del acceso de la cuenta al propietario. El [modelo de permisos de tokens de Forgejo](https://forgejo.org/docs/latest/user/authentication/token-scope/) distingue los permisos del token de los del usuario. Una cuenta sin acceso a los paquetes de una organización no lo obtiene por crear un token más amplio.

### Instalar una CA interna dentro del job

Si el contenedor no confía en la CA que firma el certificado de Forgejo, añade `ca-certificates` y `curl` al paso de instalación de herramientas. Después, antes de cualquier descarga privada, ejecuta este paso:

```yaml
- name: Instalar CA interna
  shell: bash
  env:
    INTERNAL_CA_CERT: ${{ secrets.INTERNAL_CA_CERT }}
  run: |
    set -euo pipefail
    test -n "$INTERNAL_CA_CERT"
    printf '%s\n' "$INTERNAL_CA_CERT" > /usr/local/share/ca-certificates/internal-ca.crt
    chmod 644 /usr/local/share/ca-certificates/internal-ca.crt
    update-ca-certificates
    curl --fail --silent --show-error https://forgejo.example.com/ >/dev/null
```

Este bloque supone una imagen Debian y permisos para actualizar su almacén de certificados. Expón `UV_SYSTEM_CERTS: "true"` en los pasos que utilizan uv y `TWINE_CERT: /etc/ssl/certs/ca-certificates.crt` en el de subida cuando las herramientas necesiten ese almacén.

Hay un detalle de orden: si checkout falla por TLS, instalar la CA después de checkout llega demasiado tarde. Prepara una imagen de job que ya confíe en la CA o mueve su instalación al principio del trabajo. El runner también puede necesitar esa confianza para conectarse a Forgejo; en ese caso, incorpora la CA a su propia imagen y genera la configuración con la misma versión del runner.

Una entrada en `/etc/hosts` solo resuelve un nombre. No instala una CA ni corrige un certificado emitido para otro dominio. Comprueba por separado la resolución DNS, el nombre del certificado y su cadena de confianza.

## Construir y publicar una versión

El proceso de publicación empieza con código validado y una versión identificable. Declara el nombre, la versión y el backend de construcción en `pyproject.toml`, ejecuta las pruebas y asocia la versión con un commit o una etiqueta de Git. El artículo sobre [gestión de versiones](/posts/Package-version-management/) desarrolla ese criterio.

### Generar los artefactos

Desde una copia limpia del repositorio, crea un entorno para las herramientas de publicación:

```bash
python3 -m venv .venv-publish
source .venv-publish/bin/activate
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*
```

Comprueba que `dist/` contiene únicamente los archivos de la versión que quieres publicar. Una construcción típica produce un wheel (`.whl`) y una distribución de código fuente (`.tar.gz`). Si reutilizas el directorio de trabajo, retira antes los artefactos de construcciones anteriores.

### Elegir el propietario y autenticar la subida

Los paquetes pertenecen a un usuario o a una organización. El propietario forma parte de la URL del registro y puede ser distinto del usuario que publica. La cuenta necesita permiso de escritura sobre sus paquetes.

Configura la URL, el propietario y el usuario. Para uso interactivo, introduce el token sin mostrarlo ni escribirlo directamente en el historial:

```bash
export FORGEJO_URL="https://forgejo.example.com"
export OWNER="OWNER"
export TWINE_USERNAME="USUARIO"
read -rsp "Token de publicación: " TWINE_PASSWORD
printf '\n'
export TWINE_PASSWORD

python -m twine upload \
  --repository-url "$FORGEJO_URL/api/packages/$OWNER/pypi" \
  dist/*

unset TWINE_PASSWORD TWINE_USERNAME FORGEJO_URL OWNER
```

Crea el token desde los ajustes de aplicaciones de la cuenta con los permisos necesarios. En CI, proporciona `TWINE_USERNAME` y `TWINE_PASSWORD` mediante secretos del paso de publicación.

Comprueba la versión en la página de paquetes del propietario y prueba su instalación desde un entorno limpio. Conserva cada versión publicada; los cambios posteriores deben producir una versión nueva. La [documentación del registro PyPI de Forgejo](https://forgejo.org/docs/latest/user/packages/pypi/) detalla las URLs de publicación e instalación.

### Automatizar una publicación a partir de una etiqueta

Una etiqueta permite seleccionar el commit que debe producir una versión. Antes de crearla, actualiza `project.version`, revisa el changelog, ejecuta las pruebas y confirma los cambios. Para la versión `0.1.0`:

```bash
git tag -a v0.1.0 -m "Publicar 0.1.0"
git push origin v0.1.0
```

Guarda este workflow completo como `.forgejo/workflows/publish.yml`. El ejemplo vuelve a ejecutar las pruebas sobre el commit etiquetado y publica en el mismo job. Así no depende del resultado de otra ejecución ni necesita transferir `dist/` entre jobs.

```yaml
name: Publicar paquete

on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ci
    timeout-minutes: 30
    steps:
      - name: Descargar el commit etiquetado
        uses: https://data.forgejo.org/actions/checkout@v4
        with:
          persist-credentials: false

      - name: Preparar herramientas
        shell: bash
        run: |
          set -euo pipefail
          apt-get update
          apt-get install -y --no-install-recommends python3 python3-venv python3-pip
          python3 -m venv /tmp/release-tools
          /tmp/release-tools/bin/python -m pip install uv build twine

      - name: Comprobar version, probar y construir
        shell: bash
        env:
          RELEASE_TAG: ${{ forgejo.ref_name }}
        run: |
          set -euo pipefail
          /tmp/release-tools/bin/python - <<'CHECK_VERSION'
          import os
          import tomllib
          from pathlib import Path
          project = tomllib.loads(Path("pyproject.toml").read_text())
          version = project["project"]["version"]
          expected_tag = f"v{version}"
          if os.environ["RELEASE_TAG"] != expected_tag:
              raise SystemExit(f"Expected tag {expected_tag}")
          CHECK_VERSION
          /tmp/release-tools/bin/uv sync --locked
          /tmp/release-tools/bin/uv run --locked pytest
          /tmp/release-tools/bin/python -m build
          /tmp/release-tools/bin/python -m twine check dist/*

      - name: Subir al registro
        env:
          TWINE_USERNAME: ${{ secrets.PACKAGE_PUBLISH_USERNAME }}
          TWINE_PASSWORD: ${{ secrets.PACKAGE_PUBLISH_TOKEN }}
          TWINE_NON_INTERACTIVE: "1"
        run: >-
          /tmp/release-tools/bin/python -m twine upload
          --repository-url https://forgejo.example.com/api/packages/OWNER/pypi
          dist/*
```

Sustituye `OWNER`, comprueba la etiqueta `ci` y crea los secretos de publicación antes de enviar la etiqueta. La comprobación de versión usa Python 3.11 o superior y una versión declarada directamente en `pyproject.toml`; si el proyecto calcula versiones desde Git, adapta esa comprobación al backend utilizado.

Este ejemplo mínimo supone dependencias públicas y HTTPS con una CA ya reconocida. Para dependencias privadas, proporciona los secretos de lectura al paso que sincroniza y prueba. Si utilizas una CA interna, incorpora su preparación antes de las conexiones que la necesiten y configura los almacenes de uv y Twine como en la sección anterior.

Las credenciales de publicación solo aparecen en el último paso. Si las pruebas, la construcción o la comprobación de metadatos fallan, ese paso no se ejecuta. Restringe quién puede crear las etiquetas de publicación en los ajustes de protección del repositorio: cualquier persona que pueda activar este flujo debe tener autorización para publicar ese código.

Si repites una ejecución después de una subida parcial, inspecciona primero qué archivos y versión aparecen en el registro. Una versión ya existente puede bloquear la nueva subida; no borres una versión consumida por otros proyectos solo para que el job termine en verde.

### Distinguir paquetes, artefactos y caché

El registro conserva versiones instalables. Los artefactos de Actions sirven para descargar informes o transferir archivos entre jobs de una ejecución. La caché acelera trabajo repetido y puede no estar disponible.

Si separas construcción y publicación, sube `dist/` como artefacto y descárgalo en el job dependiente; `needs` ordena los trabajos, pero no copia archivos. Elige versiones de las acciones de artefactos compatibles con Forgejo. La [guía de funciones avanzadas](https://forgejo.org/docs/latest/user/actions/advanced-features/) explica estas diferencias y las limitaciones de compatibilidad. No uses una caché como único medio para transportar lo que vas a publicar.

## Instalar el paquete desde otro proyecto

El consumidor necesita declarar qué paquete utiliza y desde qué índice debe obtenerlo. El endpoint de publicación termina en `/pypi`; el índice de instalación añade `/simple`.

Este fragmento se incorpora al `pyproject.toml` del proyecto consumidor:

```toml
[project]
dependencies = [
    "example-package==0.1.0",
]

[tool.uv.sources]
example-package = { index = "forgejo" }

[[tool.uv.index]]
name = "forgejo"
url = "https://forgejo.example.com/api/packages/OWNER/pypi/simple"
explicit = true
```

`explicit = true` reserva este índice para las dependencias que lo seleccionan en `tool.uv.sources`. Mantén las credenciales fuera de la URL y del archivo. El [modelo de índices de uv](https://docs.astral.sh/uv/concepts/indexes/) explica esta selección y su autenticación.

Para un paquete privado, configura el acceso de lectura antes de resolver e instalar:

```bash
export UV_INDEX_FORGEJO_USERNAME="USUARIO"
read -rsp "Token de lectura: " UV_INDEX_FORGEJO_PASSWORD
printf '\n'
export UV_INDEX_FORGEJO_PASSWORD

uv lock
uv sync --locked
uv run --locked python script.py

unset UV_INDEX_FORGEJO_USERNAME UV_INDEX_FORGEJO_PASSWORD
```

El nombre `FORGEJO` de las variables corresponde al índice llamado `forgejo`. Confirma `uv.lock` en Git cuando forme parte del proceso del proyecto; en CI, `uv sync --locked` detecta si las declaraciones de dependencias han quedado desalineadas con él.

### Dependencias opcionales

Si el paquete solo se necesita para una función concreta, decláralo en un extra en lugar de incluirlo en las dependencias obligatorias:

```toml
[project.optional-dependencies]
private = ["example-package==0.1.0"]
```

Conserva los bloques de origen e índice anteriores y selecciona el extra al instalar:

```bash
uv sync --extra private --locked
```

`uv sync --all-extras --locked` selecciona todos los extras. Aunque un extra no se instale, sus dependencias participan en la resolución del lockfile; crear o actualizar `uv.lock` puede necesitar acceso al índice privado. Usar `--locked` no elimina la autenticación necesaria para descargar paquetes privados. La [documentación de sincronización de uv](https://docs.astral.sh/uv/concepts/projects/sync/) distingue la resolución de la instalación.

En un workflow, las mismas credenciales se proporcionan al paso que instala dependencias:

```yaml
- name: Instalar dependencias privadas
  env:
    UV_INDEX_FORGEJO_USERNAME: ${{ secrets.PACKAGE_READ_USERNAME }}
    UV_INDEX_FORGEJO_PASSWORD: ${{ secrets.PACKAGE_READ_TOKEN }}
  run: /tmp/ci-tools/bin/uv sync --extra private --locked
```

### Verificar la instalación desde un entorno limpio

Una subida correcta no garantiza que el paquete incluya todos los archivos necesarios. Comprueba la distribución desde otro directorio, sin el código fuente del productor en la ruta de importación. Con las credenciales de lectura configuradas, puedes crear un consumidor de prueba:

```bash
mkdir consumidor-prueba
cd consumidor-prueba
uv init --bare
```

Incorpora al `pyproject.toml` generado la dependencia `example-package==0.1.0` y los bloques de índice anteriores; no añadas una segunda tabla `[project]`. Resuelve, instala y comprueba el import:

```bash
uv lock
uv sync --locked
uv run --locked python -c "from example_package import add; print(add(2, 3))"
```

El resultado debe ser `5`. Si la instalación termina pero el import falla, revisa qué módulos entraron en el wheel. Si faltan plantillas, archivos de datos u otros recursos, declara su inclusión en el backend de construcción y publica una versión nueva.

En un consumidor existente, actualizar el productor no cambia automáticamente la versión instalada. Ajusta la restricción de dependencia si hace falta, ejecuta `uv lock --upgrade-package example-package`, revisa `uv.lock` y vuelve a probar el consumidor. El lockfile registra la resolución concreta y debe acompañar ese cambio.

## Diagnosticar un fallo por etapas

La forma más útil de revisar una ejecución es identificar hasta dónde ha llegado. Un trabajo pendiente todavía no está ejecutando código; un fallo de instalación ocurre antes de las pruebas; y una subida fallida no significa necesariamente que el paquete esté mal construido.

- **El job permanece pendiente:** Runner conectado, alcance correcto y etiqueta coincidente con `runs-on`.
- **Checkout falla:** Acceso al repositorio, conectividad y herramientas de la imagen.
- **Falla la verificación TLS:** CA de confianza dentro del entorno que hace la petición.
- **El índice responde con 401 o 403:** Token, permisos, usuario y propietario del paquete.
- **No aparecen los datos de pruebas:** Ruta en el host del daemon, montaje y permisos de lectura.
- **`uv sync --locked` rechaza la instalación:** Correspondencia entre `pyproject.toml` y `uv.lock`.
- **La publicación rechaza una versión:** Versión ya existente, permisos y contenido de `dist/`.

Una vez completado el recorrido, otro proyecto debería poder instalar la versión publicada usando su propia configuración de índice y credenciales. Esa comprobación cierra el proceso: el código validado se ha convertido en una dependencia identificable y reutilizable.
