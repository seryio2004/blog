---
title: "Forgejo from start to finish: runners, CI/CD and packages"
section: "Forgejo"
language: "en"
excerpt: "A complete guide to preparing runners, automating tests and publishing reusable packages in Forgejo, with adaptable processes and examples."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-27T05:35:07.322Z"
updatedDate: "2026-10-12T00:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

Keeping code in a repository is only part of the work. We also need to check changes, prepare an environment that can run them and distribute versions that other projects can install.

Forgejo connects these tasks through Actions and its package registry. The process starts with an available runner, continues with a workflow that validates the repository and ends with a published version. Understanding each component's responsibility makes the configuration easier to maintain.

This guide describes the process without assuming an existing runner or another project to copy. The examples use Python; other languages follow the same sequence with different installation, testing and packaging tools. `forgejo.example.com`, `OWNER` and the package names are placeholders.

## How the components fit together

A **runner** executes jobs assigned by Forgejo. A **workflow** describes when those jobs run and what they do. The **package registry** stores published artifacts that other projects can download.

```text
Repository change
  → Actions event
  → workflow
  → available runner
  → dependency installation and tests
  → version build
  → registry upload
  → installation in another project
```

Tests can run for each proposed change. Publishing needs an explicit trigger: a version tag, a release or an authorized manual run. Testing a branch therefore does not automatically publish its packages.

## Prepare the execution environment

Before writing a workflow, check that Actions is enabled for the instance and repository. The runner host must reach Forgejo, the container images and the dependency indexes it will use.

Install the runner as a service or run it in a container, depending on what you can maintain. Start with configuration generated for the installed version. When reusing an existing configuration, review its paths, volumes and credentials before starting it.

### Check prerequisites before starting

This deployment uses a Linux host with Docker Engine and the Compose plugin. Your user must be able to use Docker and create the working directory. If Docker is missing, follow the [official instructions for your distribution](https://docs.docker.com/engine/install/); the runner does not install the engine.

Check the tools and host connectivity:

```bash
docker version
docker compose version
curl --fail --silent --show-error https://forgejo.example.com/ >/dev/null
```

`docker version` should report both client and server. Resolve daemon access or permission errors first. The HTTPS request checks the host; repeat it inside containers later.

An administrator can enable Actions in the Forgejo server's `app.ini`:

```ini
[actions]
ENABLED = true
```

Restart Forgejo using your deployment's service-management method. In repository settings, open the unit configuration and enable Actions. If that option is absent, inspect instance configuration. Check both levels separately.

### Create directories and generate configuration

Prepare a directory your editing user can access:

```bash
sudo mkdir -p /srv/ci/project/config /srv/ci/project/state /srv/ci/project/test-data
sudo chown "$(id -u):$(id -g)" /srv/ci/project /srv/ci/project/config
cd /srv/ci/project

docker run --rm data.forgejo.org/forgejo/runner:13 \
  forgejo-runner generate-config > config/runner.yml
```

This example uses runner series 13. Runner releases have their own numbering, which need not match the Forgejo server. Check compatibility and use the same image for configuration generation and service execution. Pin an exact version or digest once validated.

Edit `config/runner.yml` using the blocks below. These fragments belong in the generated file: update existing `runner`, `server` or `container` keys rather than adding duplicate keys. Retain other defaults and comments until you understand which settings need changing.

### Register the runner

Choose its scope: repository, user, organization or instance. A shared runner reduces repeated installations; a dedicated runner separates resources and permissions.

Create the runner in the Actions settings for that scope and save the connection details. Versions supporting interactive registration place them under `server.connections`:

```yaml
server:
  connections:
    primary:
      url: https://forgejo.example.com/
      uuid: "RUNNER_UUID"
      token: "RUNNER_TOKEN"
```

The token identifies the runner. Keep it outside the repository and restrict access to its configuration file. Registration depends on the server and runner versions; consult the [registration documentation](https://forgejo.org/docs/latest/admin/actions/registration/) for your installation.

For a repository runner, the usual path is **Settings → Actions → Runners → Create new runner**. Choose a descriptive name such as `ci-project` and copy its URL, UUID and token into the generated configuration. The URL must be reachable from the runner container; `localhost` would refer to that container, not the Forgejo server.

Creating the runner in the interface establishes its identity. It will remain disconnected until its process starts. When replacing it, register a new identity or rotate its credentials using the procedure for your version.

### Choose a label and image

A workflow selects its environment through a label. This configuration fragment associates `ci` with an example image:

```yaml
runner:
  labels:
    - "ci:docker://docker.io/library/node:22-bookworm"
```

A job using `runs-on: ci` can run in that environment. The image must provide the tools required by its actions: many reusable actions need Node.js even when testing Python code. Check the [label and image configuration](https://forgejo.org/docs/latest/admin/actions/configuration/) and pin validated tool versions or image digests.

### Separate configuration, state and data

One possible host layout is:

```text
/srv/ci/project/
├── compose.yml
├── config/
│   └── runner.yml
├── state/
└── test-data/
```

`config` holds configuration, `state` holds deployment state and `test-data` holds external test inputs. Each directory serves a different purpose and can have different permissions.

### Deploy the runner with Compose

The runner and the engine creating job containers are separate services. `engine` runs Docker-in-Docker; `runner` polls Forgejo and asks that engine to start jobs. Docker's state lives in a dedicated volume.

Save this as `/srv/ci/project/compose.yml`:

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

Compose resolves the name `engine` within its network. `DOCKER_HOST` connects the runner to that service, and the health check delays startup until Docker responds. The runner image, Docker-in-Docker image and job image serve different purposes; changing one does not update the others.

This follows the pattern in the [Docker installation guide](https://forgejo.org/docs/latest/admin/actions/installation/docker/). The daemon uses TCP without TLS within the deployment network, and Docker-in-Docker requires privileged execution. Keep port 2375 unpublished and unrelated services off this network: daemon access allows container control. Use an appropriately isolated, dedicated environment for third-party jobs.

The runner image uses a non-root user. Check its identity and assign the files it needs:

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

`state` must be writable and configuration readable by that user. After ownership changes, you may need `sudoedit config/runner.yml`. Configuration is mounted read-only; runtime state is written under `/data`.

Confirm that `engine` is healthy and Forgejo reports the runner connected. Restart after editing runner configuration:

```bash
docker compose restart runner
```

Apply Compose changes with `docker compose up -d`. Stop services with `docker compose down`, retaining the Docker volume when you need its images and state. Adding `--volumes` also removes the volume declared here.

Give separate resources their own names and paths when adding a project. Do not copy another runner's token. You do not need a new runner for every repository when an existing runner already covers its scope.

Copy external test data to the host or download it during the job. For example:

```bash
rsync -avh --progress ./test-data/ user@HOST:/srv/ci/project/test-data/
```

With Docker-in-Docker, a bind-mount source must exist where the daemon creating the job containers runs. Mount inputs read-only when possible, and set CPU, memory and execution limits to suit the workload.

### Mount test inputs where the job needs them

In this deployment, `engine` creates jobs. A mount on the runner alone will not make input files available to the daemon. First expose them to Docker-in-Docker, then ask it to mount them in jobs.

Add this entry to the `engine` service's `volumes` list:

```yaml
- ./test-data:/test-data:ro
```

Merge this into `container` in `config/runner.yml`:

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

The first `--volume` path is what the daemon sees inside `engine`; the second is what the job sees. `valid_volumes` restricts mounts workflows can request. Do not allow the entire host to work around a path error.

Apply Compose changes and restart the runner. Check `ls -lah /test-data` in a workflow step before testing. For tests requiring writes, copy inputs into a temporary working directory. These resource limits apply to a job container; also review runner concurrency against host capacity.

### Run a first connectivity check

Before dependency installation and tests, create `.forgejo/workflows/smoke.yml`:

```yaml
name: Check runner
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

Push it to the default branch and run it manually from Actions. If your instance uses an internal CA, prepare container trust first using the certificate section below. This separates runner assignment, image and networking failures from project failures.

The run should report the user identity, Node.js and Git versions, and complete its HTTPS request. A pending job still needs scope or label checks. A started job with a missing command needs a different or updated job image.

## Describe the work in a workflow

Workflows live in `.forgejo/workflows/`. A YAML file describes events that trigger execution, jobs assigned to runners and steps executed in order within each job.

Forgejo Actions uses syntax similar to GitHub Actions, but compatibility should be checked for each action and feature. The [Actions quick start](https://forgejo.org/docs/latest/user/actions/quick-start/) explains how to enable it and run a first workflow.

### Prepare an installable Python project

The workflow needs a project that can be installed. A minimal layout separates package code, tests and automation:

```text
project/
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

`example-package` is the distribution name in the registry; `example_package` is the Python import name. A `src` layout helps prevent tests from finding source code accidentally through the repository root.

This complete `pyproject.toml` defines a simple setuptools package:

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

Add a small function in `src/example_package/__init__.py`:

```python
def add(left: int, right: int) -> int:
    return left + right
```

Test its behavior in `tests/test_example.py`:

```python
from example_package import add


def test_add():
    assert add(2, 3) == 5
```

With uv installed locally, resolve the environment and test before pushing the workflow:

```bash
uv lock
uv sync --locked
uv run --locked pytest
```

Commit `pyproject.toml`, `uv.lock`, source and tests. Add `.venv/`, `.venv-publish/`, `dist/`, `build/` and `*.egg-info/` to `.gitignore`. uv installs the development group `dev` by default; extras in `project.optional-dependencies` describe optional package features. The [Python packaging guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/) explains metadata and build backends.

### A testing example

This example assumes a project with `pyproject.toml`, a committed `uv.lock` and `pytest` declared as a development dependency. The runner must provide the `ci` label and an image that can execute checkout and install Python tools.

Save it as `.forgejo/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  tests:
    name: Validate project
    runs-on: ci
    timeout-minutes: 30

    steps:
      - name: Check out code
        uses: https://data.forgejo.org/actions/checkout@v4
        with:
          persist-credentials: false

      - name: Install tools
        shell: bash
        run: |
          set -euo pipefail
          apt-get update
          apt-get install -y --no-install-recommends python3 python3-venv python3-pip
          python3 -m venv /tmp/ci-tools
          /tmp/ci-tools/bin/python -m pip install uv
          /tmp/ci-tools/bin/uv --version

      - name: Install dependencies
        run: /tmp/ci-tools/bin/uv sync --locked

      - name: Run tests
        run: /tmp/ci-tools/bin/uv run --locked pytest
```

The installation step assumes a Debian image and sufficient permissions to use `apt-get`. For a stable environment, prepare a CI image containing pinned tool versions and replace installation with availability checks. The full checkout URL identifies its source; use a reviewed commit to pin the action's exact content.

### Understand what survives between steps

Steps share a job's workspace, but each `run` starts a new shell process. Files survive for later steps; an `export` inside one shell does not configure subsequent shells. Provide variables through job or step `env` instead.

That is why the example calls `/tmp/ci-tools/bin/uv` explicitly. `/tmp/ci-tools` holds automation tools; the project's `.venv`, created by uv, holds project dependencies. These environments have different purposes.

`uv sync --locked` requires an up-to-date lockfile and fails if it would need to change it. Run `uv lock` locally, review the changes and commit before rerunning CI. `uv run --locked pytest` uses the project environment; failed tests stop the job before publication.

If tests generate data or prepare resources, add a step between synchronization and pytest. Check its inputs and return an error when preparation fails. Avoid `continue-on-error` for preparation on which the tests depend.

### Adjust events, jobs and steps

`push` checks changes reaching `main`; `pull_request` checks proposed changes; and `workflow_dispatch` allows manual execution. Replace `main` with your default branch.

Branch and path filters control when jobs run. For example, add `paths-ignore: ["docs/**"]` under `push` if documentation changes do not require these tests. Review filters so they still cover changes affecting the project.

Each job has an identifier, a `runs-on` label and a time limit. When separating testing and publishing into jobs, add `needs: tests` to publishing so it requires successful tests. Files created in one job are not automatically transferred to another: rebuild from the same commit or transfer artifacts explicitly.

Within a job, `uses` invokes an action and `with` supplies inputs. `run` executes commands, `env` provides variables, `working-directory` changes the execution directory and `shell` selects the interpreter.

Tests must return a nonzero exit code on failure. If your project uses custom scripts, put discovery and execution behind a repository command. This lets you run it locally and add tests without editing the workflow.

## Access private resources

Store credentials for code and package downloads as Actions secrets. Expose each secret only to the step that needs it, and separate dependency-reading credentials from publishing credentials.

For SSH checkout, supply a repository-access key and verified known hosts through the action's `ssh-key` and `ssh-known-hosts` inputs. Extra SSH access is unnecessary when normal checkout already works with the job's authentication.

If your instance uses an internal certificate authority, install its CA certificate in every environment establishing a connection. The runner, job container and publishing tools may have separate trust stores. On Debian or Ubuntu, place the trusted CA certificate with a `.crt` extension under `/usr/local/share/ca-certificates/` and run `update-ca-certificates`.

Obtain the certificate from a trusted source and retain TLS verification. uv can use the system trust store with `UV_SYSTEM_CERTS=true`; Twine accepts a certificate file through `TWINE_CERT`.

Jobs handling external contributions need careful permission boundaries. Keep publishing in a trusted context, separate from execution of code that has not been reviewed.

### Create and assign secrets

Open **Actions → Secrets** in repository settings and create the secrets your workflow actually uses. Their roles here are:

- `PACKAGE_READ_USERNAME` and `PACKAGE_READ_TOKEN`: account and token for private dependency downloads.
- `PACKAGE_PUBLISH_USERNAME` and `PACKAGE_PUBLISH_TOKEN`: account and token for publishing versions.
- `INTERNAL_CA_CERT`: public internal CA certificate in PEM format, when needed.
- `SSH_PRIVATE_KEY` and `SSH_KNOWN_HOSTS`: repository SSH access and verified hosts, when using SSH checkout.

The runner token belongs to host configuration and does not replace these secrets. Do not assume a workflow's automatic token can access every private registry; check the resource and required permissions.

For personal tokens, use the relevant package scopes: `read:package` for downloads and `write:package` for publishing, together with the account's access to the owner. The [Forgejo token permission model](https://forgejo.org/docs/latest/user/authentication/token-scope/) distinguishes token scopes from account permissions. A broader token does not grant its account access to an organization's packages.

### Install an internal CA inside a job

If the job container does not trust the CA signing Forgejo's certificate, add `ca-certificates` and `curl` to tool installation. Before private downloads, run:

```yaml
- name: Install internal CA
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

This assumes a Debian image and permission to update its trust store. Set `UV_SYSTEM_CERTS: "true"` on uv steps and `TWINE_CERT: /etc/ssl/certs/ca-certificates.crt` on uploads when the tools need that store.

Ordering matters: if checkout fails TLS verification, installing the CA after checkout is too late. Use a job image that already trusts the CA or install it at the start. The runner itself may also need that trust to connect; incorporate the CA into its own image and keep the runner version consistent with configuration generation.

An `/etc/hosts` entry only resolves a hostname. It neither installs a CA nor fixes a certificate issued for another domain. Check DNS, certificate hostname and trust chain separately.

## Build and publish a version

Start with validated code and an identifiable version. Declare the package name, version and build backend in `pyproject.toml`, run tests and associate the version with a commit or Git tag. The [version management article](/en/posts/Package-version-management/) explains that process further.

### Generate artifacts

From a clean repository checkout, create an environment for publishing tools:

```bash
python3 -m venv .venv-publish
source .venv-publish/bin/activate
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*
```

Verify that `dist/` contains only files for the intended version. A typical build produces a wheel (`.whl`) and a source distribution (`.tar.gz`). When reusing a working directory, remove previous build artifacts first.

### Choose the owner and authenticate

Packages belong to a user or organization. The owner is part of the registry URL and may differ from the publishing user. The publishing account needs permission to write that owner's packages.

Set the server, owner and username. For an interactive upload, enter the token without displaying it or putting its value directly in shell history:

```bash
export FORGEJO_URL="https://forgejo.example.com"
export OWNER="OWNER"
export TWINE_USERNAME="USER"
read -rsp "Publishing token: " TWINE_PASSWORD
printf '\n'
export TWINE_PASSWORD

python -m twine upload \
  --repository-url "$FORGEJO_URL/api/packages/$OWNER/pypi" \
  dist/*

unset TWINE_PASSWORD TWINE_USERNAME FORGEJO_URL OWNER
```

Create the token in the account's application settings with the necessary permissions. In CI, supply `TWINE_USERNAME` and `TWINE_PASSWORD` through publishing-step secrets.

Check the version on the owner's package page and install it in a clean environment. Preserve published versions; subsequent changes should produce a new version. The [Forgejo PyPI registry documentation](https://forgejo.org/docs/latest/user/packages/pypi/) describes publishing and installation endpoints.

### Automate publishing from a version tag

A tag selects the commit that should produce a version. Update `project.version`, review the changelog, run tests and commit first. For version `0.1.0`:

```bash
git tag -a v0.1.0 -m "Publish 0.1.0"
git push origin v0.1.0
```

Save this complete workflow as `.forgejo/workflows/publish.yml`. It reruns tests on the tagged commit and publishes in the same job, avoiding dependence on a separate workflow run or artifact transfer between jobs.

```yaml
name: Publish package

on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ci
    timeout-minutes: 30
    steps:
      - name: Check out tagged commit
        uses: https://data.forgejo.org/actions/checkout@v4
        with:
          persist-credentials: false

      - name: Prepare tools
        shell: bash
        run: |
          set -euo pipefail
          apt-get update
          apt-get install -y --no-install-recommends python3 python3-venv python3-pip
          python3 -m venv /tmp/release-tools
          /tmp/release-tools/bin/python -m pip install uv build twine

      - name: Check version, test and build
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

      - name: Upload to registry
        env:
          TWINE_USERNAME: ${{ secrets.PACKAGE_PUBLISH_USERNAME }}
          TWINE_PASSWORD: ${{ secrets.PACKAGE_PUBLISH_TOKEN }}
          TWINE_NON_INTERACTIVE: "1"
        run: >-
          /tmp/release-tools/bin/python -m twine upload
          --repository-url https://forgejo.example.com/api/packages/OWNER/pypi
          dist/*
```

Replace `OWNER`, check the `ci` label and create publishing secrets before pushing the tag. The version check requires Python 3.11 or newer and a version declared directly in `pyproject.toml`. Adapt it when your backend derives versions from Git.

This minimal example assumes public dependencies and an already trusted HTTPS certificate. For private dependencies, provide read secrets to the synchronization and testing step. For an internal CA, prepare trust before affected connections and configure uv and Twine as described above.

Publishing credentials are only exposed to the final step. Failed tests, builds or metadata checks prevent that step from running. Restrict who can create publication tags through repository protection settings: anyone able to trigger this workflow must be authorized to publish its code.

Before retrying a partially completed upload, inspect existing registry files and versions. An existing version may block uploads; do not remove a version used by consumers merely to make the job pass.

### Distinguish packages, artifacts and cache

The registry stores installable versions. Actions artifacts make reports downloadable or transfer files between jobs in a run. Cache speeds up repeated work and may be absent.

When separating build and publish, upload `dist/` as an artifact and download it in the dependent job. `needs` orders jobs but does not copy files. Choose artifact action versions compatible with Forgejo. The [advanced features guide](https://forgejo.org/docs/latest/user/actions/advanced-features/) explains these distinctions and compatibility limits. Do not rely on cache as the only transport for publication files.

## Install the package in another project

Consumers declare both the package and its source index. The upload endpoint ends in `/pypi`; the installation index adds `/simple`.

Add this fragment to the consuming project's `pyproject.toml`:

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

`explicit = true` reserves this index for dependencies selecting it through `tool.uv.sources`. Keep credentials outside the URL and file. The [uv index documentation](https://docs.astral.sh/uv/concepts/indexes/) explains selection and authentication.

For private packages, provide read access before resolving and installing:

```bash
export UV_INDEX_FORGEJO_USERNAME="USER"
read -rsp "Read token: " UV_INDEX_FORGEJO_PASSWORD
printf '\n'
export UV_INDEX_FORGEJO_PASSWORD

uv lock
uv sync --locked
uv run --locked python script.py

unset UV_INDEX_FORGEJO_USERNAME UV_INDEX_FORGEJO_PASSWORD
```

`FORGEJO` in the variable names corresponds to the index named `forgejo`. Commit `uv.lock` when it forms part of your project's process; in CI, `uv sync --locked` detects dependency declarations that no longer match it.

### Optional dependencies

If only a particular feature requires the package, declare it in an extra instead of mandatory dependencies:

```toml
[project.optional-dependencies]
private = ["example-package==0.1.0"]
```

Keep the source and index blocks above and select the extra during installation:

```bash
uv sync --extra private --locked
```

`uv sync --all-extras --locked` selects every extra. Even unselected extras participate in lockfile resolution, so creating or updating `uv.lock` may require private-index access. `--locked` does not remove authentication required for private downloads. The [uv syncing documentation](https://docs.astral.sh/uv/concepts/projects/sync/) distinguishes resolution from installation.

In a workflow, supply the same credentials to dependency installation:

```yaml
- name: Install private dependencies
  env:
    UV_INDEX_FORGEJO_USERNAME: ${{ secrets.PACKAGE_READ_USERNAME }}
    UV_INDEX_FORGEJO_PASSWORD: ${{ secrets.PACKAGE_READ_TOKEN }}
  run: /tmp/ci-tools/bin/uv sync --extra private --locked
```

### Verify installation in a clean environment

A successful upload does not guarantee all required files are included. Test the distribution from another directory with the producer's source absent from the import path. With read credentials configured, create a test consumer:

```bash
mkdir test-consumer
cd test-consumer
uv init --bare
```

Add `example-package==0.1.0` and the source/index blocks above to its generated `pyproject.toml`; do not add another `[project]` table. Resolve, install and check the import:

```bash
uv lock
uv sync --locked
uv run --locked python -c "from example_package import add; print(add(2, 3))"
```

The result should be `5`. If installation succeeds but import fails, inspect the modules included in the wheel. Declare missing templates, data or other resources through your build backend and publish a new version.

Updating the producer does not automatically change an existing consumer's installed version. Adjust dependency constraints when needed, run `uv lock --upgrade-package example-package`, review `uv.lock` and retest the consumer. Commit the lockfile alongside that update.

## Diagnose failures by stage

Identify how far execution has progressed. A pending job has not started running code; dependency installation fails before tests; and an upload failure does not necessarily mean the build is invalid.

- **Job remains pending:** Runner connection, scope and label matching `runs-on`.
- **Checkout fails:** Repository access, connectivity and image tools.
- **TLS verification fails:** Trusted CA in the environment making the request.
- **Index returns 401 or 403:** Token, permissions, username and package owner.
- **Test data is missing:** Daemon-host path, mount and read permissions.
- **`uv sync --locked` rejects installation:** Agreement between `pyproject.toml` and `uv.lock`.
- **Upload rejects a version:** Existing version, permissions and `dist/` contents.

After completing the process, another project should be able to install the published version using its own index configuration and credentials. That check completes the cycle: validated code has become an identifiable, reusable dependency.
