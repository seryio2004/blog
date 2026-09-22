---
title: "Crear y publicar un paquete en Forgejo"
section: "Forgejo"
language: "es"
excerpt: "Cómo construir un paquete de Python, publicarlo en el registro de Forgejo e instalarlo con uv desde un índice privado."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-27T05:35:07.322Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---

# Crear y publicar un paquete

Partimos del repositorio que contiene el código que queremos empaquetar.

> **Importante:** para subir paquetes debes tener instalado el certificado HTTPS de la instancia de Forgejo. Si no está disponible en tu equipo, pide al administrador que lo instale.

## Crear y activar un entorno virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## Instalar las herramientas necesarias

```bash
python -m pip install --upgrade pip
python -m pip install build twine
```

Comprueba que `pyproject.toml` tenga definidos el nombre y la versión del paquete.

## Limpiar artefactos anteriores

Antes de construir una versión nueva, elimina los directorios generados previamente:

```bash
rm -rf dist build
```

## Construir el paquete

```bash
python -m build
```

Comprueba el resultado:

```bash
ls -lh dist/
```

Deberías ver archivos similares a estos:

```text
dist/
├── example_package-0.1.0-py3-none-any.whl
└── example_package-0.1.0.tar.gz
```

## Configurar las variables de publicación

El paquete puede pertenecer a un usuario o a una organización. Para publicarlo en una organización, la cuenta debe tener permiso de escritura sobre sus paquetes.

```bash
export FORGEJO_URL="https://forgejo.example.com"
export FORGEJO_USER="YOUR_USER"
export OWNER="YOUR_OWNER"
export TOKEN="YOUR_TOKEN"
```

Sustituye los valores por el servidor, el usuario, el propietario del paquete y el token correspondientes. Si publicas en tu propia cuenta, puedes usar `OWNER="$FORGEJO_USER"`.

### Crear el token

Crea un token con permisos de lectura y escritura de paquetes. Si la instancia usa una cuenta compartida para publicar, consulta al administrador cómo obtener acceso.

```text
Perfil → Ajustes → Aplicaciones → Nuevo token de acceso
```

Ponle un nombre descriptivo y asígnale solo los permisos necesarios. Guarda el token al crearlo: no podrás volver a verlo al salir de la pantalla.

## Publicar el paquete

```bash
python -m twine upload \
  --repository-url "$FORGEJO_URL/api/packages/$OWNER/pypi" \
  -u "$FORGEJO_USER" \
  -p "$TOKEN" \
  dist/*
```

Si todo funciona, la salida será parecida a:

```text
Uploading distributions to https://forgejo.example.com/api/packages/YOUR_OWNER/pypi
Uploading example_package-0.1.0-py3-none-any.whl
100% ...
Uploading example_package-0.1.0.tar.gz
100% ...
```

Si falla por el certificado TLS aunque ya esté instalado en la máquina, indica a Twine dónde encontrar el almacén de certificados:

```bash
export TWINE_CERT="/etc/ssl/certs/ca-certificates.crt"
```

El paquete ya puede instalarse como dependencia estable de otros proyectos. Los cambios posteriores del repositorio no alteran la versión publicada.

## Borrar las variables del entorno

```bash
unset FORGEJO_URL FORGEJO_USER OWNER TOKEN
```

## Dónde ver el paquete

El paquete aparecerá en el perfil del usuario u organización indicados en `OWNER`.

# Instalar el proyecto localmente con uv

`uv` puede crear y gestionar automáticamente el entorno virtual a partir de `pyproject.toml`; no es necesario crear `.venv` manualmente.

## Instalar sin dependencias opcionales

Para crear `.venv` e instalar las dependencias normales:

```bash
uv sync
```

Si el repositorio contiene un `uv.lock` actualizado y no quieres modificarlo:

```bash
uv sync --locked
```

No necesitas activar el entorno al ejecutar comandos mediante uv:

```bash
uv run python script.py
```

Si prefieres activarlo manualmente:

```bash
source .venv/bin/activate
```

## Definir dependencias opcionales

Las dependencias que no necesita todo el mundo pueden separarse en un grupo opcional dentro de `pyproject.toml`. Por ejemplo, los paquetes privados de Forgejo pueden agruparse en un extra llamado `private`:

```toml
[project]
dependencies = [
    "numpy>=1.26,<3",
    "taichi>=1.7,<1.8",
    "trimesh>=4.8,<5",
    "PyYAML>=6,<7",
]

[project.optional-dependencies]
private = [
    "example-package==0.1.0",
    "example-tools==0.1.0",
]

[tool.uv.sources]
example-package = { index = "forgejo" }
example-tools = { index = "forgejo" }

[[tool.uv.index]]
name = "forgejo"
url = "https://forgejo.example.com/api/packages/YOUR_OWNER/pypi/simple"
explicit = true
```

Una instalación normal no incluye el extra `private`:

```bash
uv sync
```

## Instalar un grupo opcional concreto

Configura las credenciales del índice privado y activa el extra:

```bash
export UV_INDEX_FORGEJO_USERNAME="YOUR_USER"
export UV_INDEX_FORGEJO_PASSWORD="YOUR_TOKEN"
export UV_SYSTEM_CERTS="true"

uv sync --extra private
```

El nombre que sigue a `--extra` debe coincidir con el declarado en `[project.optional-dependencies]`.

Para instalar todos los grupos opcionales:

```bash
uv sync --all-extras
```

Las credenciales de Forgejo también deben estar disponibles si alguno de esos grupos es privado.

## `uv.lock` y las dependencias privadas opcionales

Aunque `uv sync` no instala un extra que no hayas seleccionado, sus paquetes siguen participando en la resolución cuando uv crea o actualiza `uv.lock`. Por eso puede necesitar las credenciales del índice privado incluso si el extra no se va a instalar.

Para quienes clonan el repositorio, conviene confirmar un `uv.lock` actualizado y ejecutar:

```bash
uv sync --locked
```

Para incluir las dependencias privadas:

```bash
export UV_INDEX_FORGEJO_USERNAME="YOUR_USER"
export UV_INDEX_FORGEJO_PASSWORD="YOUR_TOKEN"
export UV_SYSTEM_CERTS="true"

uv sync --extra private --locked
```

Después puedes ejecutar comandos sin activar el entorno:

```bash
uv run python script.py
uv run pytest
```

# Usar los paquetes como dependencias

La opción más clara es declararlos en `pyproject.toml` e indicar que proceden de un índice diferente al de los paquetes públicos:

```toml
[project]
dependencies = [
    "numpy>=1.26,<3",
    "taichi>=1.7,<1.8",
    "trimesh>=4.8,<5",
    "PyYAML>=6,<7",
    "example-package==0.1.0",
    "example-tools==0.1.0",
]

[tool.uv.sources]
example-package = { index = "forgejo" }
example-tools = { index = "forgejo" }

[[tool.uv.index]]
name = "forgejo"
url = "https://forgejo.example.com/api/packages/YOUR_OWNER/pypi/simple"
explicit = true
```

La URL depende del propietario. Usa el mismo `OWNER` al publicar y al configurar el índice para que el origen resulte fácil de rastrear.

## Configurarlo en un workflow

```yaml
- name: Instalar uv
  shell: bash
  run: |
    set -euo pipefail
    curl -LsSf https://astral.sh/uv/install.sh \
      | env UV_UNMANAGED_INSTALL="/usr/local/bin" sh
    uv --version

- name: Instalar dependencias
  env:
    UV_INDEX_FORGEJO_USERNAME: ${{ secrets.PACKAGE_READ_USERNAME }}
    UV_INDEX_FORGEJO_PASSWORD: ${{ secrets.PACKAGE_READ_TOKEN }}
    UV_SYSTEM_CERTS: "true"
  run: |
    uv sync
```

Las credenciales se guardan como secretos de Forgejo y se exponen únicamente al paso que instala los paquetes privados.
