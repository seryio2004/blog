---
title: "Adding a Forgejo runner for a new repository"
section: "Forgejo"
language: "en"
excerpt: "How to add a repository-specific runner to an Ubuntu host where another Forgejo runner is already working."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-16T05:35:07.322Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

# Runner guide

This guide adds a runner for a new repository to an Ubuntu machine where another runner is already working. The project names, paths and server addresses are examples; replace them with values from your installation.

## Create the directory for the new repository

As `root`, move to the runner directory:

```bash
cd /srv/forgejo-runners
```

Create a directory for the new repository:

```bash
mkdir proyecto-nuevo
```

## Copy the base files from another repository

We will use an existing example repository named `proyecto-base`. Copy its `compose.yml` and its runner configuration, which lives under `data`.

Both `.yml` and `.yaml` are valid, but use the same extension consistently. The intended structure is:

```text
/srv/forgejo-runners
├── proyecto-base
│   ├── compose.yml
│   ├── data
│   │   └── runner-config.yml
│   └── data-proyecto-base
│       └── files required by the tests
├── proyecto-nuevo
│   ├── compose.yml
│   ├── data
│   │   └── runner-config.yml
│   └── data-proyecto-nuevo
│       └── files required by the tests
└── otro-proyecto
```

Copy the files and create the data directory:

```bash
sudo cp proyecto-base/compose.yml proyecto-nuevo/compose.yml
sudo mkdir -p proyecto-nuevo/data
sudo cp proyecto-base/data/runner-config.yml proyecto-nuevo/data/runner-config.yml
```

# Configure the files

## `compose.yml`

Open `compose.yml` and update the project-specific names and paths in the Docker-in-Docker service:

```yaml
volumes:
  - dind-data-proyecto-nuevo:/var/lib/docker
  - /srv/forgejo-runners/shared/data:/shared/data:ro
  - type: bind
    source: ./data-proyecto-nuevo
    target: /srv/forgejo-runners/proyecto-nuevo/data-proyecto-nuevo
    read_only: true
```

At the end of the file, give the named volume a unique and descriptive key and name:

```yaml
volumes:
  dind-data-proyecto-nuevo:
    name: forgejo_proyecto_nuevo_dind-data
```

Validate the resulting Compose configuration before starting it:

```bash
cd /srv/forgejo-runners/proyecto-nuevo
sudo docker compose -p proyecto-nuevo config
```

## `runner-config.yml`

First create the new runner in Forgejo:

1. Open the repository.
2. Go to **Settings**.
3. Open **Actions → Runners** (the label may vary with the interface language).
4. Select **Create new runner**.
5. Give it a descriptive name such as `runner-proyecto-nuevo`.
6. Save the Forgejo URL, UUID and token separately.

> Save these values before leaving the page. The token will not be shown again.

Open the copied configuration:

```bash
nano runner-config.yml
```

Find the labels section:

```yaml
labels:
  - python-unit:docker://docker.io/library/python:3.12
```

Change only `python-unit` to the label you want to assign to this runner. Workflows select the runner through this label.

In the `container` section, update the mounted test-data path:

```yaml
options: >-
  --volume /srv/forgejo-runners/proyecto-nuevo/data-proyecto-nuevo:/test-data:ro
  --memory=16g
  --memory-swap=16g
  --cpus=2
  --pids-limit=256
  --add-host=forgejo.example.com:192.0.2.10
```

The domain and IP passed to `--add-host` are examples. Use your server's values only if you need to resolve it this way.

The remaining options limit runner resources. Depending on the test workload, `--cpus=1` may be enough.

Update `valid_volumes` with the same new path:

```yaml
valid_volumes:
  - /srv/forgejo-runners/proyecto-nuevo/data-proyecto-nuevo
```

Finally, replace the connection name, URL, UUID and token with the values Forgejo generated:

```yaml
connections:
  proyecto-nuevo:
    url: https://forgejo.example.com/
    uuid: "UUID_DEL_RUNNER"
    token: "TOKEN_DEL_RUNNER"
```

# Copy the data required by the tests

From the machine that currently holds the data directory, run:

```bash
rsync -avh --progress \
  ./data/ \
  usuario@SERVIDOR:/srv/forgejo-runners/proyecto-nuevo/data-proyecto-nuevo/
```

The first path is the local directory and the second is its destination on the runner host. Replace `usuario` and `SERVIDOR` with your SSH login details.

# Start the runner

Start the Compose project:

```bash
cd /srv/forgejo-runners/proyecto-nuevo
sudo docker compose -p proyecto-nuevo up -d
```

Check its state:

```bash
sudo docker compose -p proyecto-nuevo ps
```

If something went wrong, inspect the latest logs:

```bash
sudo docker compose -p proyecto-nuevo logs --tail=100
```
