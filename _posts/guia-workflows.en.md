---
title: "Building CI/CD workflows with Forgejo"
section: "Forgejo"
language: "en"
excerpt: "A practical introduction to Forgejo CI/CD workflows, events, jobs, steps, secrets and a reusable Python test pipeline."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-18T05:35:07.322Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---

# Workflow guide

To add CI/CD to a repository, create `.forgejo/workflows`. Files such as `unit-test.yml` describe the steps a runner performs after a configured event such as a push or pull request.

Workflows can read private Forgejo variables called **secrets**. They let a job access private packages, clone repositories over SSH, deploy code or send email without committing credentials to the repository.

# Reference workflow

The domain `forgejo.example.com`, the `python-tests` runner label and the paths below are examples. Adapt them to your server and repository.

```yaml
name: Project tests

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  project-tests:
    name: Prepare data and run tests
    runs-on: python-tests
    timeout-minutes: 360

    steps:
      - name: Check out repository over SSH
        uses: actions/checkout@v4
        with:
          ssh-key: ${{ secrets.SSH_PRIVATE_KEY }}
          ssh-known-hosts: ${{ secrets.SSH_KNOWN_HOSTS }}
          ssh-strict: true
          ssh-user: git
          persist-credentials: false

      - name: Install Python and system tools
        shell: bash
        run: |
          set -euo pipefail
          apt-get update
          DEBIAN_FRONTEND=noninteractive apt-get install -y \
            --no-install-recommends \
            python3 git curl openssh-client ca-certificates
          rm -rf /var/lib/apt/lists/*
          python3 --version

      - name: Install the internal CA certificate
        shell: bash
        env:
          INTERNAL_CA_CERT: ${{ secrets.INTERNAL_CA_CERT }}
        run: |
          set -euo pipefail
          test -n "$INTERNAL_CA_CERT"
          printf '%s\n' "$INTERNAL_CA_CERT" \
            > /usr/local/share/ca-certificates/forgejo-ca.crt
          chmod 644 /usr/local/share/ca-certificates/forgejo-ca.crt
          update-ca-certificates
          test -s /etc/ssl/certs/ca-certificates.crt

          HTTP_CODE="$(
            curl --fail --silent --show-error \
              --output /dev/null \
              --write-out '%{http_code}' \
              https://forgejo.example.com/
          )"
          echo "Forgejo returned HTTP $HTTP_CODE"

      - name: Install uv
        shell: bash
        run: |
          set -euo pipefail
          curl -LsSf https://astral.sh/uv/install.sh \
            | env UV_UNMANAGED_INSTALL="/usr/local/bin" sh
          uv --version

      - name: Resolve and install dependencies
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

      - name: Prepare test data
        shell: bash
        working-directory: ${{ github.workspace }}
        env:
          PYTHONUNBUFFERED: "1"
        run: |
          set -euo pipefail
          PYTHON="$GITHUB_WORKSPACE/.venv/bin/python"
          "$PYTHON" tests/prepare_data.py
          test -d tests/data

      - name: Run functional tests
        shell: bash
        working-directory: ${{ github.workspace }}
        run: |
          set -uo pipefail
          PYTHON="$GITHUB_WORKSPACE/.venv/bin/python"
          TESTS_FOUND=0
          FAILED_TESTS=0

          while IFS= read -r -d '' TEST_FILE; do
            TESTS_FOUND=$((TESTS_FOUND + 1))
            echo "Running: $TEST_FILE"
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
              -print0 | sort -z
          )

          if [ "$TESTS_FOUND" -eq 0 ]; then
            echo "ERROR: no main.py or main_*.py files were found"
            exit 1
          fi

          echo "Tests found:  $TESTS_FOUND"
          echo "Tests failed: $FAILED_TESTS"
          if [ "$FAILED_TESTS" -ne 0 ]; then
            exit 1
          fi
```

## Events

Apart from its name, the workflow begins with its event configuration:

```yaml
on:
  push:
  pull_request:
  workflow_dispatch:
```

Common events include `push`, `pull_request`, `pull_request_target`, `issues`, `issue_comment`, `release`, `schedule`, `workflow_dispatch` and `workflow_call`.

If both `push` and `pull_request` are unrestricted, the same tests may run twice. Limit an event to specific branches:

```yaml
on:
  push:
    branches:
      - develop
      - master
```

or ignore selected branches:

```yaml
on:
  push:
    branches-ignore:
      - master
      - documentation
```

Branch patterns are also supported:

```yaml
on:
  push:
    branches:
      - develop
      - "feature/**"
      - "fix/**"
```

You can filter by changed paths too:

```yaml
on:
  push:
    paths-ignore:
      - "docs/**"
      - "*.md"
```

`workflow_dispatch` adds a manual run option in Forgejo, which is useful while testing a workflow:

```yaml
on:
  workflow_dispatch:
```

## Jobs

A job is a complete unit of work sent to one runner. A workflow may contain several jobs assigned to different runner labels.

```yaml
jobs:
  project-tests:
    name: Prepare data and run tests
    runs-on: python-tests
    timeout-minutes: 360
```

- `project-tests` is the internal identifier.
- `name` is displayed in Forgejo.
- `runs-on` selects the label configured in `runner-config.yml`.
- `timeout-minutes` limits the total execution time.

A future pipeline might separate concerns:

```yaml
jobs:
  lint:
    # Check code formatting
  tests:
    # Run tests
  publish:
    # Publish a package
```

## Steps

Jobs contain sequential steps. A reusable action is invoked with `uses`:

```yaml
- name: Check out repository over SSH
  uses: actions/checkout@v4
  with:
    ssh-key: ${{ secrets.SSH_PRIVATE_KEY }}
    ssh-known-hosts: ${{ secrets.SSH_KNOWN_HOSTS }}
    ssh-strict: true
    ssh-user: git
    persist-credentials: false
```

Here, `actions` is the owner, `checkout` is the action and `@v4` is its version. `with` supplies its inputs. Checkout places the requested repository commit on the runner.

Other useful step keys are:

- `env`: environment variables for this step;
- `working-directory`: the directory in which commands run;
- `shell`: the interpreter, usually Bash;
- `run`: shell, Python or other script commands;
- `timeout-minutes`: a per-step time limit;
- `continue-on-error`: whether later steps may continue after a failure.

## A reusable test-step structure

A typical testing job follows this order:

1. Check out the repository.
2. Install Python and required system tools.
3. Install the TLS certificate needed for private packages.
4. Install uv.
5. Resolve dependencies from `pyproject.toml`.
6. Prepare data and any other test prerequisites.
7. Discover and run the tests.

The example test loop searches `tests` and its subdirectories for `main.py`, `main_1.py`, `main_2.py`, and similar files. New tests can therefore be added without editing the workflow. If a project must exclude specific tests, add `! -path` filters to the `find` command.
