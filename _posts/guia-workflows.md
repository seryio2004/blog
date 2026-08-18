---
title: "Como crear workflows para CI/CD basandonos en forgejo"
excerpt: "En esta guía se aprendera como crear workflows basicos para la ejecución de tests basandonos en el sistema de git de forgejo, la sintaxis y funcionamiento es el mismo que sigue github actions"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2026-08-18T05:35:07.322Z"
author:
  name: TypeShit
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---


# Guía workflows

En todo repo que se quiera implementar CI/CD se debe de crear la carpeta .`forgejo`  que a su vez contendrá  la carpeta `workflows`  en esta carpeta existirán los archivos `unit-test.ym` los cuales especifican los pasos que deben seguir los runner para poder ejecutar los test o realizar diferentes acciones.

Los workflows están compuestos de diferentes pasos secuenciales que realizara el runner cuando detecte una acción especificada de antemano(push, pull request , etc) estos pasos pueden variar dependiendo de las características de cada test y cada repositorio.

Los workflows tienen acceso a variables privadas registradas en forgejo llamadas **secretos**, estos secretos nos sirven para ocultar valores privados que no se deben de compartir. Dentro del workflow podremos usar estas variables para acceder a ciertos recurso como paquetes, clonar repositorios mediante ssh, desplegar código de forma automática e incluso enviar correos desde cuentas privadas.

# Ejemplo de workflow que usaremos como referencia

```bash
name: Tests del interpolador aerodinamico

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  interpolator-tests:
    name: Generar datos y comparar interpoladores
    runs-on: gpu-test
    timeout-minutes: 360

    steps:
      - name: Descargar repositorio mediante SSH
        uses: actions/checkout@v4
        with:
          ssh-key: ${{ secrets.SSH_PRIVATE_KEY }}
          ssh-known-hosts: ${{ secrets.SSH_KNOWN_HOSTS }}
          ssh-strict: true
          ssh-user: git
          persist-credentials: false

      - name: Instalar Python y herramientas del sistema
        shell: bash
        run: |
          set -euo pipefail

          apt-get update
          DEBIAN_FRONTEND=noninteractive apt-get install -y \
            --no-install-recommends \
            python3 \
            git \
            curl \
            openssh-client \/
            ca-certificates

          rm -rf /var/lib/apt/lists/*
          python3 --version

      - name: Instalar certificado de la CA interna
        shell: bash
        env:
          INTERNAL_CA_CERT: ${{ secrets.INTERNAL_CA_CERT }}
        run: |
          set -euo pipefail

          test -n "$INTERNAL_CA_CERT"
          printf '%s\n' "$INTERNAL_CA_CERT" \
            > /usr/local/share/ca-certificates/kreios-internal-ca.crt
          chmod 644 /usr/local/share/ca-certificates/kreios-internal-ca.crt
          update-ca-certificates
          test -s /etc/ssl/certs/ca-certificates.crt

          HTTP_CODE="$(
            curl \
              --fail \
              --silent \
              --show-error \
              --output /dev/null \
              --write-out '%{http_code}' \
              https://repos.internal/
          )"
          echo "Forgejo respondio con HTTP $HTTP_CODE"

      - name: Instalar uv
        shell: bash
        run: |
          set -euo pipefail

          curl -LsSf https://astral.sh/uv/install.sh \
            | env UV_UNMANAGED_INSTALL="/usr/local/bin" sh
          uv --version

      - name: Resolver e instalar dependencias
        shell: bash
        working-directory: ${{ github.workspace }}
        env:
          UV_LINK_MODE: copy
          UV_INDEX_FORGEJO_USERNAME: ${{ secrets.PACKAGE_READ_USERNAME }}
          UV_INDEX_FORGEJO_PASSWORD: ${{ secrets.PACKAGE_READ_TOKEN }}
          UV_SYSTEM_CERTS: "true"
        run: |
          set -euo pipefail

          uv sync 
          test -x "$GITHUB_WORKSPACE/.venv/bin/python"
          "$GITHUB_WORKSPACE/.venv/bin/python" --version

    

      - name: Generar base e interpolador nuevos
        shell: bash
        working-directory: ${{ github.workspace }}
        env:
          PYTHONUNBUFFERED: "1"
        run: |
          set -euo pipefail

          PYTHON="$GITHUB_WORKSPACE/.venv/bin/python"
          "$PYTHON" tests/interpolator/prepare_test_data.py

          test -s tests/interpolator/data/benchmark_new.h5
          test -s tests/interpolator/benchmark_new.npz

      - name: Ejecutar tests funcionales
        shell: bash
        working-directory: ${{ github.workspace }}
        run: |
          set -uo pipefail

          PYTHON="$GITHUB_WORKSPACE/.venv/bin/python"
          TESTS_FOUND=0
          FAILED_TESTS=0

          while IFS= read -r -d '' TEST_FILE; do
            TESTS_FOUND=$((TESTS_FOUND + 1))

            echo
            echo "=================================================="
            echo "Ejecutando: $TEST_FILE"
            echo "=================================================="

            if "$PYTHON" "$TEST_FILE"; then
              echo "PASS: $TEST_FILE"
            else
              echo "FAIL: $TEST_FILE"
              FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
          done < <(
            find "$GITHUB_WORKSPACE/tests" \
              -type f \
              \( -name "main.py" -o -name "main_*.py" \) \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_4/*" \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_6/*" \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_7/*" \
              ! -path "$GITHUB_WORKSPACE/tests/clausing_benchmark/*" \
              -print0 |
            sort -z
          )

          if [ "$TESTS_FOUND" -eq 0 ]; then
            echo "ERROR: no se encontraron archivos main.py o main_*.py"
            exit 1
          fi

          echo
          echo "Tests encontrados: $TESTS_FOUND"
          echo "Tests fallidos:    $FAILED_TESTS"

          if [ "$FAILED_TESTS" -ne 0 ]; then
            exit 1
          fi
```

## Eventos

Es por donde empezara el workflow (sin contar el nombre)

```bash
on:
  push:
  pull_request:
  workflow_dispatch:
```

Nos permiten ejecutar el workflow después de una determinada acción, los eventos en los que podemos ejecutar el workflow son los siguientes;

```bash
push, pull_request, pull_request_target, issues, issue_comment,
release, schedule, workflow_dispatch y workflow_call

```

Cuando tenemos push y pull_request si no especificamos nada se ejecutaran dos veces los test, para que eso no pase podemos especificar que un evento solo ocurra en ciertas ramas; 

```bash
on:
  push:
    branches:
      - develop
      - master
```

o que no se ejecute en ciertas ramas

```bash
on:
  push:
    branches-ignore:
      - master
      - documentation
```

también podemos usar patrones de ramas:

```bash
on:
  push:
    branches:
      - develop
      - "feature/**"
      - "fix/**"
```

o incluso patrones de archivos y carpetas: 

```bash
on:
  push:
    paths-ignore:
      - "docs/**"
      - "*.md"
```

Con la opción `workflow_dispatch` podremos ejecutar el workflow manualmente desde forgejo, esto es muy útil para no tener que hacer push vacíos para testear 

```bash
on:
  workflow_dispatch:
```

## Jobs

Un job es una unidad de trabajo completa que forgejo entrega un a un runner, Dentro de un workflow podemos tener varios jobs asignados a diferentes runners(no es nuestro caso de momento)

```bash
jobs:
  interpolator-tests:
    name: Generar datos y comparar interpoladores
    runs-on: gpu-test
    timeout-minutes: 360
```

donde; `interpolator-tests`  es el identificador interno del job

`name:`  es el nombre que aparece en forgejo

`runs-on:` es la etiqueta del runner(especificada en el runner-config.yml)

`timeout-minutes:`  tiempo máximo del que se dispone para realizar el trabajo 

Una estructura de jobs interesante de cara al futuro seria la siguiente:

```bash
jobs:
  lint:
    # Comprobar formato del código

  tests:
    # Ejecutar los tests

  publish:
    # Publicar un paquete
```

## Steps

Los jobs están compuestos de pasos secuenciales llamados steps, cada workflow requiere de pasos específicos para su correcto funcionamiento.

Un step se define de la siguiente manera: 

```bash
- name: Descargar repositorio mediante SSH
        uses: actions/checkout@v4
        with:
          ssh-key: ${{ secrets.SSH_PRIVATE_KEY }}
          ssh-known-hosts: ${{ secrets.SSH_KNOWN_HOSTS }}
          ssh-strict: true
          ssh-user: git
          persist-credentials: false
```

`Name:` nombre mostrado en forgejo

`uses:` ejecuta una acción reutilizable, en este caso `actions/checkout@v4` 

`actions`  seria el propietario/espacio donde esta publicada la acción 

`checkout`  es el nombre de la acción

`@v4` es la versión 

La acción de checkout no sirve para poder colocar en el runner una copia de los archivos del repositorio correspondientes al commit que debe ejecutar el workflow

`with:` proporciona parámetros para realizar la acción

En este caso se proporcionan las variables ssh necesarias para poder hacer el pull del repo

En otros casos podemos usar mas parámetros como los siguientes: 

`env:` define variables para el paso

`working-directory` para especificar el entorno de ejecución

`shell:` selecciona el interprete (normalmente bash)

`run:` ejecuta comandos(pueden ser bash, python o cualquier lenguaje de srcipting)

`timeout-minutes:` limar el tiempo del paso

`continue-on-error:` para poder continuar después de un fallo 

## Estructura de los steps

Los primeros pasos para los trabajos de testing siempre son iguales

1. Descargar el **repositorio** 
2. Instalar **python y herramientas** necesarias para el sistema
3. Instalar el **certificado TLS** para poder usar paquetes
4. Instalar **uv** para poder usar los paquetes y optimizar tiempo de descarga de dependencias
5. **Descargar dependencias**(con pyproject podemos descargar todas las dependencias en un mismo paso, incluyendo el codigo de otros repositorios)
6. Acciones necesarias antes del test( como habilitar la carpeta data, generar archivos necesarios para el test, etc)
7. Ejecutar los test( la mejor forma de definir este paso es con script de busqueda de profundidad y definir siempre los test de la misma manera, en mi caso defino subcarpetas con el nombre de cada test y dentro de estas subcarpetas archivos main_**** para así poder añadir nuevos test sin tener que modificar el workflow) 

```bash
- name: Ejecutar tests funcionales
        shell: bash
        working-directory: ${{ github.workspace }}
        run: |
          set -uo pipefail

          PYTHON="$GITHUB_WORKSPACE/.venv/bin/python"
          TESTS_FOUND=0
          FAILED_TESTS=0

          while IFS= read -r -d '' TEST_FILE; do
            TESTS_FOUND=$((TESTS_FOUND + 1))

            echo
            echo "=================================================="
            echo "Ejecutando: $TEST_FILE"
            echo "=================================================="

            if "$PYTHON" "$TEST_FILE"; then
              echo "PASS: $TEST_FILE"
            else
              echo "FAIL: $TEST_FILE"
              FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
          done < <(
            find "$GITHUB_WORKSPACE/tests" \
              -type f \
              \( -name "main.py" -o -name "main_*.py" \) \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_4/*" \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_6/*" \
              ! -path "$GITHUB_WORKSPACE/tests/sparta_comparison_7/*" \
              ! -path "$GITHUB_WORKSPACE/tests/clausing_benchmark/*" \
              -print0 |
            sort -z
          )

          if [ "$TESTS_FOUND" -eq 0 ]; then
            echo "ERROR: no se encontraron archivos main.py o main_*.py"
            exit 1
          fi

          echo
          echo "Tests encontrados: $TESTS_FOUND"
          echo "Tests fallidos:    $FAILED_TESTS"

          if [ "$FAILED_TESTS" -ne 0 ]; then
            exit 1
          fi
```

Este script busca dentro de la carpeta tests(excluyendo ciertos test que no están terminados), después dentro de sus subcarpetas y por ultimo los main_1, main_2 ….