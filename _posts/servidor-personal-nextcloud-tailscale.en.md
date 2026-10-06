---
title: "From an old tower to a personal server: Docker, Grafana, Tailscale and Nextcloud"
section: "Infrastructure"
language: "en"
excerpt: "Turning an old tower into a home server with Docker, centralized monitoring, remote access through Tailscale and Nextcloud using two independent drives."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-10-06T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

# From an old tower to a personal server: Docker, Grafana, Tailscale and Nextcloud

For quite a while, I had a tower PC that did little more than take up space. It was not particularly powerful and had no clear purpose, but it did have something useful: hard drives, a permanent network connection and enough hardware to run several services without too much trouble.

So I decided to turn it into my personal server.

The idea was not to build a huge *homelab* or fill Docker with services just for the sake of it. I wanted something useful in everyday life: centralized storage, access to my files away from home, monitoring for my machines, self-hosted services and a foundation for deploying projects.

For now, the result looks something like this:

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

The best part is that all of this runs on a machine I already owned.

---

## The starting point

The server runs Ubuntu Server and has several drives with fairly distinct roles.

The layout ended up roughly like this:

```text
System SSD
└── Ubuntu Server

Secondary SSD
└── /srv/docker-projects
    └── Docker projects and services

1 TB internal HDD
└── /srv/storage
    ├── media
    └── nextcloud-hdd

1 TB Toshiba USB drive
└── /mnt/usb
```

Separating the system, containers and data has been convenient.

Containers can be removed, updated or recreated without directly touching the important files.

---

## Docker as the foundation

Most of the server's services live in Docker.

Among others, I currently run:

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

With `docker ps`, I can quickly see what is running:

```bash
docker ps
```

For each project, I try to keep a simple structure:

```text
/srv/docker-projects/apps/
├── nextcloud/
├── monitoring/
├── power-dashboard/
└── ...
```

Each service has its own `compose.yaml`, environment variables and configuration.

It is not Kubernetes. It does not need to be.

For a home server, Docker Compose covers practically everything I need and makes rebuilding a service straightforward.

---

## Monitor first, break things later

One of the first things I set up was Prometheus + Grafana.

The idea was simple: if I was going to keep a machine running services around the clock, I wanted to know what it was doing.

The server runs `node-exporter`, which exposes metrics such as:

- CPU usage;
- RAM;
- disk;
- network;
- system load;
- uptime.

Prometheus collects those metrics, and Grafana makes them readable.

```text
Node Exporter
     │
     ▼
 Prometheus
     │
     ▼
   Grafana
```

I later added my laptop and a Raspberry Pi 3B that I am using for another project.

On the laptop:

```text
192.168.1.x:9100
```

On the Raspberry Pi:

```text
192.168.1.x:9100
```

The central Prometheus instance on the server queries all the machines.

For the Raspberry Pi, I set the scrape interval to 30 seconds, less frequent than a 15-second interval:

```yaml
- job_name: "raspberry"
  scrape_interval: 30s
  static_configs:
    - targets:
        - "192.168.1.x:9100"
```

The IPs are placeholders: each machine needs its own real address. This block belongs under `scrape_configs` in `prometheus.yml`. If the machines are on different networks, I can use their Tailscale addresses; Prometheus also needs connectivity to that network. Port 9100 must be reachable from Prometheus.

I do not need to know every second whether a Raspberry Pi is using 12% or 14% of its CPU.

---

### Node Exporter uses surprisingly few resources

One of my doubts was whether installing Node Exporter on a Raspberry Pi 3B made sense.

In practice, the answer was yes.

After starting it, `systemctl status` showed only a few milliseconds of accumulated CPU time after several minutes of running.

That counter measures accumulated CPU time, not an instantaneous percentage or the complete impact. To assess resource usage, it also helps to watch memory and metrics under a real workload.

To check which processes were actually consuming resources, I could use:

```bash
ps aux --sort=-%cpu | head -15
```

Or simply:

```bash
htop
```

This is especially useful on the Raspberry Pi because it will eventually run my sampler, and I want to know how far I can push the hardware before audio starts to suffer.

---

## Remote access with Tailscale

The next problem was obvious.

Everything worked perfectly at home, but I wanted to access the server from anywhere without opening ports on the router.

That is where Tailscale came in.

Installation on Ubuntu is straightforward:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

After authenticating the device, the server receives a private IP within the Tailscale network.

From that point on, I can run:

```bash
ssh server
```

From my laptop, even when I am away from home.

The alias lives in:

```text
~/.ssh/config
```

For example:

```sshconfig
Host server
    HostName 100.x.x.x
    User sk
```

The same applies to the Raspberry Pi:

```sshconfig
Host raspberry
    HostName 100.x.y.z
    User sk
```

The addresses `100.x.x.x` and `100.x.y.z` are examples: replace them with each machine's real Tailscale IP. A name such as `sampler.local` normally resolves through mDNS on the local network; for access away from home, I use the Tailscale IP or a MagicDNS name.

This seems trivial until you stop typing IP addresses all the time.

---

## Building my own Drive with Nextcloud

With remote access sorted out, the next step made sense: use the server for personal storage.

For that, I installed Nextcloud.

The architecture I chose was:

```text
Nextcloud
├── PostgreSQL
├── Redis
├── Internal HDD
└── External USB drive
```

PostgreSQL is the database, and Redis handles caching and file locking.

Everything lives inside Docker except the actual data.

---

### Two storage locations, not an improvised RAID

I had an important decision to make here.

The server has an internal HDD with plenty of space, plus a 1 TB USB drive that already contained data.

I did not want to combine them.

I also did not want one to be merely a backup of the other.

I wanted two completely independent storage locations inside Nextcloud.

The result was:

```text
Nextcloud

Main files
└── /srv/storage/nextcloud-hdd

USB
└── /mnt/usb
```

The internal HDD serves as the account's primary storage.

The USB drive appears in Nextcloud as a separate external storage location.

This lets me decide where to save things without physically mixing the drives.

---

## The `compose.yaml`

The Nextcloud stack ended up being fairly standard. This is an example foundation for a new installation with the same drive layout; adapt paths, credentials and names to each machine:

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

Alongside `compose.yaml`, the `.env` file needs these values:

```dotenv
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_UNIQUE_PASSWORD
NEXTCLOUD_TRUSTED_DOMAINS=localhost
```

I do not commit `.env` to Git. The PostgreSQL variables initialize a new database; changing the password in `.env` later does not automatically change the user's password inside an existing database.

`app` and `cron` share the same volumes and image. In Nextcloud, select **Cron** in the background job settings; the container runs those jobs. For a reproducible deployment, pin the patch version or digest and update both services together, following the supported upgrade path. The [Nextcloud image documentation](https://hub.docker.com/_/nextcloud) explains the variables and volumes; its [Compose examples](https://github.com/nextcloud/docker/tree/master/.examples/docker-compose) include the cron service.

Before starting, I check that the drives are mounted and that the primary data directory has permissions for `www-data` inside the container:

```bash
findmnt /srv/storage
findmnt /mnt/usb
ls -ld /srv/storage/nextcloud-hdd
docker compose config --quiet
docker compose up -d db redis app
docker compose exec -u www-data app php occ status
```

I complete the initial setup wizard in the browser. Once the application is installed, I start cron and inspect the logs:

```bash
docker compose up -d cron
docker compose ps
docker compose logs --tail=100 app cron
```

In this example, port 8080 listens only on the server's loopback interface. From the laptop, I can open an SSH tunnel over the Tailscale connection:

```bash
ssh -N -L 8080:127.0.0.1:8080 server
```

While that session stays open, I visit `http://localhost:8080` on the laptop. For direct access from a phone or sync client, one option is to configure [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve) with HTTPS inside the private network. That also requires adjusting Nextcloud's trusted domain and proxy configuration. Publishing `8080:80` without a specific IP would make Docker listen on all host interfaces.

The resulting layout is:

```text
Docker
│
├── Nextcloud configuration
│
├── PostgreSQL
│
└── Redis

Host
│
├── HDD → primary data
└── USB → external storage
```

---

## The USB drive and the little hell of FAT32

The USB drive already held years of files and was formatted as FAT32.

That meant I did not want to reformat it.

It also meant Linux permissions did not work quite as they do on ext4.

The drive was originally mounted like this:

```text
uid=1000
gid=1000
fmask=0022
dmask=0022
```

That allowed my user to write, but Nextcloud, which runs as `www-data`, could not.

The solution was to mount FAT32 with the `www-data` group:

```text
uid=1000
gid=33
fmask=0113
dmask=0002
```

In `/etc/fstab`:

```fstab
UUID=XXXX-XXXX /mnt/usb vfat uid=1000,gid=33,fmask=0113,dmask=0002,iocharset=utf8,nofail 0 0
```

With that:

```text
sk        → read/write
www-data  → read/write
```

On FAT32, permissions are assigned at mount time: `chown` and `chmod` do not work as they do on ext4. These masks give files mode `0664` and directories mode `0775`. The values `1000` and `33` correspond to my user and `www-data` in this installation; check them before copying:

```bash
id sk
getent group www-data
docker compose exec app id www-data
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/usb
```

I could test access directly:

```bash
sudo -u www-data touch /mnt/usb/.nextcloud-test
sudo rm /mnt/usb/.nextcloud-test
docker compose exec -u www-data app sh -c \
  'touch /mnt/usb/.nextcloud-container-test && rm /mnt/usb/.nextcloud-container-test'
```

The second test also verifies access from inside the container. If I change `/etc/fstab` options, I need to stop `app` and `cron` before unmounting and remounting the USB drive, then recreate both containers. Editing the file alone does not change the active mount.

`nofail` allows Ubuntu to boot without that drive, but it does not prevent Docker from using the empty directory underneath the mount point. Before starting Nextcloud, check the mount; to automate this, make the stack's startup depend on the required drives.

FAT32 also limits each file to less than 4 GiB. Increasing PHP or Nextcloud limits does not remove that filesystem restriction.

---

## The bug that looked like Nextcloud but was not Nextcloud

After adding the USB drive as external storage, Nextcloud showed it as:

```text
Pending
```

Trying to open it simply did not work.

Permissions were correct.

Docker could see the drive.

`www-data` could create files.

So it was time to inspect the logs.

The important error was:

```text
invalid byte sequence for encoding "UTF8": 0xba
```

It appeared while trying to index a folder named:

```text
1\xBA informatica
```

There was the problem.

The drive contained a folder whose name used the character `º`, but FAT32 was exposing it in an encoding PostgreSQL could not accept as valid UTF-8.

Running:

```bash
LC_ALL=C ls -lb /mnt/usb
```

Showed:

```text
1\272\ informatica
```

That `\272` corresponds to byte `0xBA`.

After mounting the drive with:

```text
iocharset=utf8
```

The name arrived correctly as UTF-8, and Nextcloud could index the storage.

That was the adjustment that solved my case. VFAT also has a `utf8` option, and it is worth checking the options supported by the system before reusing this `fstab` line everywhere; the [`mount` manual](https://man7.org/linux/man-pages/man8/mount.8.html) describes filename conversion. There was no need to change PostgreSQL's encoding or blindly rename files.

Problems like this are probably the best possible definition of running a home server:

> Everything works except a folder created three years ago from another operating system.

---

## Adding the USB drive to Nextcloud

Once permissions and encoding were sorted out, all that remained was enabling external storage support:

```bash
docker compose exec -u www-data app \
  php occ app:enable files_external
```

Then, in the interface:

```text
Administration
→ External storage
```

Configuration:

```text
Name:             USB
Type:             Local
Path:             /mnt/usb
Authentication:   None
```

A mount configured by the administrator is available to all users by default. In an instance with more accounts, I can restrict it to specific users or groups using the availability field, as explained in the [external storage documentation](https://docs.nextcloud.com/server/stable/admin_manual/configuration_files/external_storage_configuration_gui.html).

After that, Nextcloud displays the files that were already on the drive.

They are not copied.

They are not duplicated.

Nextcloud simply accesses the same `/mnt/usb`.

If I modify files on the USB drive outside Nextcloud, its index may need updating. I can run a scan for my user:

```bash
docker compose exec -u www-data app php occ files:scan USUARIO_NEXTCLOUD
```

`USUARIO_NEXTCLOUD` is the account ID, not the Linux user. By contrast, Nextcloud manages the primary directory `/var/www/html/data`: I do not treat it as a shared folder for manually copying and deleting files.

---

## Two drives are not a backup

Separating the HDD and USB gives me two destinations, but by itself it does not protect against a failed drive, accidental deletion or server failure. Synchronization does not replace a backup either: it can propagate deletions to other devices.

I still need to automate a backup system. For Nextcloud, it must cover the database, primary data, configuration and any custom apps or themes, as well as the USB files I want to preserve. The [Nextcloud backup guide](https://docs.nextcloud.com/server/stable/admin_manual/maintenance/backup.html) details those elements and the use of maintenance mode to avoid inconsistencies.

I want to keep at least one copy outside this machine and verify that I can restore it. A persistent volume lets me recreate a container; recovering a complete installation also requires retaining its data and database.

---

## What I can do with the server now

At this point, the tower is no longer just "an old PC left running".

It now serves several purposes at once.

### Personal cloud

Nextcloud lets me store and access files from any device.

The internal HDD is the primary storage, and the USB drive is a second independent location.

### Media server

Jellyfin uses the server's storage to serve media to other devices on the network.

### Centralized monitoring

Grafana lets me see these machines in one place:

```text
Server
Laptop
Raspberry Pi
```

With CPU, RAM, disk, network and load metrics.

### Remote access

Tailscale makes it possible to reach the server away from home without being connected to my Wi-Fi.

### A platform for projects

I can also use it to deploy my own applications.

One example is `power-dashboard`, which already runs as another Docker container.

I also plan to deploy personal websites with their own databases hosted on the server. The idea is to use this infrastructure to develop and maintain my projects, both the applications and their data.

To publish them under my own domains, I plan to use Cloudflare Tunnel. The websites I choose to make public will have their own domain, while I continue using Tailscale for private access to the server.

One of those projects will be a dedicated training website. I will write a separate article about it later, explaining what it does and how I built and deployed it.

---

## The interesting part is not Nextcloud

After setting all this up, what interests me most is not really having "my own Google Drive".

It is having my own infrastructure.

Something like:

```text
                        sk-server
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       services          projects           data
          │                 │                 │
     Nextcloud           my own              HDD
     Jellyfin          applications          USB
     Grafana
     Prometheus
          │
          └────────── observability
```

Each new project can use what already exists.

If an application needs deploying, Docker is already there.

If I want to know how many resources it uses, Prometheus is already there.

If I want access away from home, Tailscale is already there.

If it needs storage, I already have a structure ready.

That is probably the biggest change.

I have gone from several independent computers to a small home infrastructure.

---

## What is left to do

There is still plenty of room to make this unnecessarily complicated.

Some of the next things I will probably add are:

- HTTPS for internal services;
- a reverse proxy so I can stop remembering ports;
- local DNS names;
- cAdvisor to monitor individual containers;
- Loki to centralize logs;
- Uptime Kuma to quickly see which services are down;
- Forgejo for internal Git repositories;
- a proper backup system.

Because, obviously, having a home server is never about finishing it.

It is about finding the next thing you are not monitoring yet.

---

## Current state

For now, the infrastructure looks like this:

```text
Tailscale
└── sk-server (Ubuntu Server)
    ├── Nextcloud
    │   ├── PostgreSQL
    │   ├── Redis
    │   ├── HDD → primary data
    │   └── USB → external storage
    ├── Prometheus → Grafana
    │   └── Node Exporter: server, laptop and Raspberry Pi
    └── Jellyfin
```

It is not a datacenter.

But it is starting to look too serious to keep calling it "the old tower".
