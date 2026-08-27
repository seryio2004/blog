---
title: "Create and upload a package in forgejo"
section: "Forgejo"
language: "en"
excerpt: "En esta guía se explicara el proceso para generar codigo empaquetado a raiz de un repositorio, para asi poder usarlo como modulo estable y mejorar la trazabilidad."
coverImage: "/assets/blog/guia_runners/runner.jpg"
date: "2026-08-27T05:35:07.322Z"
author:
  name: Nigi nigez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# Create and upload a package

From the relevant repo:

# Important!!

To upload these packages you must have the HTTPS certificate installed.

If your computer does not have this certificate installed, ask the administrator to install it.

## Activate/create a virtual environment:

```bash
python3 -m venv .venv
v
```

## Install the required tools:

```bash
python -m pip install --upgrade pip
python -m pip install build twine
```

## Make sure pyproject.toml has a name and version

## Before building the package, delete previous artifacts

```bash
rm -rf dist build
```

## Build the package

```bash
python -m build
```

### To check:

```bash
ls -lh dist/
```

#### You should see something like:

dist/
├── kreios_adbsat-0.1.0-py3-none-any.whl
└── kreios_adbsat-0.1.0.tar.gz

## Configure the variables used to upload the package (by default it must be uploaded under a user; to upload it at the administration level you need write/admin permissions on the Kreios space)

```bash
export FORGEJO_URL="https://repos.internal"
export FORGEJO_USER="package.admin"
export OWNER="$FORGEJO_USER"
export TOKEN="token"
```

Replace the user and token values with your own.

#### To create the token:

If you want to upload using the package.admin user, it is best to reuse the existing token (ask the administrator).

```bash
Perfil->Configuración->aplicaciones->nuevo token de acceso->packege:write 	and read
```

Give the token a descriptive name.

Write this token down; once you leave this menu it cannot be viewed again.

## Publish the package

```bash
python -m twine upload \
  --repository-url "$FORGEJO_URL/api/packages/$OWNER/pypi" \
  -u "$FORGEJO_USER" \
  -p "$TOKEN" \
  dist/*
```

If everything went well, you should see something like:

```bash
Uploading distributions to https://repos.internal/api/packages/USR FORGEJO/pypi
Uploading kreios_adbsat-0.1.0-py3-none-any.whl
100% ...
Uploading kreios_adbsat-0.1.0.tar.gz
100% ...
```

If it fails because of the TLS certificate and it is already installed on the machine, run the following command:

```bash
export TWINE_CERT="/etc/ssl/certs/ca-certificates.crt"
```

This package can now be installed as a dependency of other packages with a stable version. If you make changes to this repo that break other repos, it won't matter, because this package is stable and contains the information from when it was uploaded.

## Clear the environment variables

```
unset FORGEJO_URLunset FORGEJO_USERunset OWNERunset TOKEN
```

## Where to view the package

The package will belong to and be shown in the owner's profile.

## How to install the project locally with uv

`uv` can create and manage the virtual environment automatically from the `pyproject.toml` file. It is not necessary to create the `.venv` manually with `python -m venv`.

### Install without optional dependencies

To create the `.venv` and install the normal project dependencies:

```bash
uv sync
```

`uv` creates the `.venv` automatically if it does not exist.

If the repository contains an up-to-date `uv.lock` and you do not want `uv` to modify it, use:

```bash
uv sync --locked
```

The virtual environment does not need to be activated when commands are executed through `uv`:

```bash
uv run python script.py
```

If you prefer to activate it manually:

```bash
source .venv/bin/activate
```

### Define optional dependencies

Dependencies that are not required for every user can be separated into an optional group in `pyproject.toml`. For example, the packages hosted in Forgejo can be grouped under an extra called `kreios`:

```toml
[project]
dependencies = [
    "numpy>=1.26,<3",
    "taichi>=1.7,<1.8",
    "trimesh>=4.8,<5",
    "PyYAML>=6,<7",
]

[project.optional-dependencies]
kreios = [
    "kreios-environment==0.1.1",
    "kreios-geometry==0.1.0",
]

[tool.uv.sources]
kreios-environment = { index = "forgejo" }
kreios-geometry = { index = "forgejo" }

[[tool.uv.index]]
name = "forgejo"
url = "https://repos.internal/api/packages/package.admin/pypi/simple"
explicit = true
```

With this configuration, a normal installation does not install the `kreios` extra:

```bash
uv sync
```

### Install a specific optional dependency group

To install the normal dependencies together with the optional `kreios` dependencies, configure the credentials for the private index and enable the extra:

```bash
export UV_INDEX_FORGEJO_USERNAME="YOUR_USER"
export UV_INDEX_FORGEJO_PASSWORD="YOUR_TOKEN"
export UV_SYSTEM_CERTS="true"

uv sync --extra kreios
```

The name after `--extra` must match the name declared in `[project.optional-dependencies]`.

For example:

```toml
[project.optional-dependencies]
kreios = [
    "kreios-environment==0.1.1",
    "kreios-geometry==0.1.0",
]
```

is installed with:

```bash
uv sync --extra kreios
```

### Install all optional dependencies

If the project defines more than one optional dependency group and all of them are required:

```bash
uv sync --all-extras
```

For private optional dependencies, the Forgejo credentials must also be available before running this command.

### Important note about uv.lock and private optional dependencies

Optional dependencies are not installed by `uv sync` unless their extra is selected, but they are still part of dependency resolution when `uv` needs to create or update `uv.lock`.

For this reason, if the optional dependencies come from the private Forgejo index, credentials may still be required when the lock file is generated or updated, even when the extra is not going to be installed.

For normal users cloning a repository, it is recommended to commit an up-to-date `uv.lock` and install with:

```bash
uv sync --locked
```

To install the private optional dependencies as well:

```bash
export UV_INDEX_FORGEJO_USERNAME="YOUR_USER"
export UV_INDEX_FORGEJO_PASSWORD="YOUR_TOKEN"
export UV_SYSTEM_CERTS="true"

uv sync --extra kreios --locked
```

After installation, commands can be executed without activating the environment:

```bash
uv run python script.py
uv run pytest
```

## How to use these packages as dependencies

The most elegant option would be to specify these packages as dependencies in pyproject, but it is important to indicate that they belong to a different index from the one holding the rest of the public packages:

```bash
dependencies = [
    "numpy>=1.26,<3",
    "taichi>=1.7,<1.8",
    "trimesh>=4.8,<5",
    "PyYAML>=6,<7",

    "kreios-environment==0.1.1", <------------
    "kreios-geometry==0.1.0", <---------------
]

[tool.uv.sources]
kreios-environment = { index = "forgejo" }
kreios-geometry = { index = "forgejo" }

[[tool.uv.index]]
name = "forgejo"
url = "https://repos.internal/api/packages/package.admin/pypi/simple"<----------
explicit = true

```

The URL changes depending on who creates these packages, so it is recommended to always use the package.admin user to manage packages and thus keep a simple, easy-to-trace structure.

### How to specify it in the workflow

```bash
- name: Install uv
       shell: bash
       run: |
         set -euo pipefail

         curl -LsSf https://astral.sh/uv/install.sh \
           | env UV_UNMANAGED_INSTALL="/usr/local/bin" sh

         uv --version

     - name: Install dependencies
       env:
         UV_INDEX_FORGEJO_USERNAME: ${{ secrets.PACKAGE_READ_USERNAME }}
         UV_INDEX_FORGEJO_PASSWORD: ${{ secrets.PACKAGE_READ_TOKEN }}
         UV_SYSTEM_CERTS: "true"
       run: |
         uv sync    
```

To manage these packages you must install the uv tool and then provide, via Forgejo secrets (variables whose value is private and are set in the Forgejo web interface), the access credentials for these packages so they can be installed with

```bash
uv sync
```

If you have any questions about this guide, you can ask me at my personal email:

