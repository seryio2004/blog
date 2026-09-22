---
title: "TV Remote: turning an old laptop into a smart remote"
section: "Projects"
language: "en"
excerpt: "How I reused a Lenovo G580 as a phone-controlled media center with FastAPI, Docker, Chrome, Playwright and ydotoold."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-09-22T19:07:58.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---

# TV Remote

The other day, my flatmates and I were sitting in the living room of our student apartment and wanted to watch something on our ancient TV. Being the iPad kid that I am, I did not want to connect my main laptop because I wanted to keep working on a few projects. That gave me the idea of bringing my old Lenovo G580, which I have had since I was eight, back to life.

The HDMI cable is not long enough to operate the computer comfortably, so putting anything on the TV is a pain. I decided to build a system that serves a web app on my local network, controls the computer and turns my phone into a smart remote. I also set up the laptop as a dedicated appliance that starts everything whenever it boots.

The remote lets me paste URLs for YouTube, Netflix, Prime and even my trusty pirate streaming sites. More importantly, it includes a joystick for moving the mouse and making the experience slightly better—only slightly, because there is some latency.

All this project needs is an old computer running Ubuntu or another Linux distribution, a local Wi-Fi network, a phone that can open the page, Chrome or Chromium, Docker, Python 3 and a recent version of `ydotoold`.

P.S. I do not know whether this already exists in a more convenient form. It did not seem too complicated, and I wanted to see what building it would involve.

# Architecture design

The original idea was simple: create a website with a field where I could paste a URL and have it open on the laptop. At first, I considered embedding a video player in the web app itself, but conventional streaming platforms make that approach rather painful in practice.

The solution was to use Chrome as the player and the web app only as a remote.

The final architecture looks like this:

```text
Phone
  │
  │ HTTP
  ▼
FastAPI in Docker :8000
  │
  ├──────────────► Chrome :9222
  │                  │
  │                  └── YouTube / Netflix / Prime / any website
  │
  └──────────────► runtime/ydotool.sock
                     │
                     ▼
                  ydotoold
                     │
                     └── /dev/uinput
                          │
                          └── mouse / keyboard
```

FastAPI runs in a Docker container using the host network and exposes the web interface to the local network. Any phone connected to the same Wi-Fi can simply open:

```text
http://computer_ip:8000
```

Chrome runs directly on Ubuntu. This allows me to use a normal browser session, keep cookies so I do not have to sign in repeatedly, and leave DRM compatibility to Chrome and the Linux configuration.

# Controlling Chrome

To send URLs from the phone, I launch Chrome with its remote debugging port enabled. The project actually does this through `scripts/start-browser.sh`, which finds Chrome or Chromium and configures the profile and display mode automatically, but the underlying command is essentially:

```bash
google-chrome \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.local/share/tv-reomote/chrome-profile" \
  --no-first-run \
  --disable-session-crashed-bubble \
  --start-fullscreen \
  https://www.youtube.com/
```

The backend connects to that port with Playwright through the Chrome DevTools Protocol:

```python
self._browser = await self._playwright.chromium.connect_over_cdp(
    self.cdp_url,
    timeout=3000
)
```

It can then perform actions such as:

```python
await page.goto(url)
```

It can also navigate backward and forward, reload the page, return to YouTube, enter text, put Chrome in fullscreen mode and close pop-up windows.

> One important detail is that port 9222 listens only on localhost. I neither need nor want every device on my network to control Chrome directly; all communication goes through FastAPI first.

# The headache: controlling the mouse

The previous part was easy to configure. This one took considerably more work.

Opening a URL is useful, but getting off the sofa whenever an action requires moving the mouse would defeat the whole purpose of the project. Most operations could be implemented as direct Chrome actions, but I found that approach less convenient, so I added a joystick that controls the system pointer.

When I move the joystick on the phone, JavaScript generates small relative movements and sends them to the API:

```text
POST /api/mouse/move
```

The backend turns those movements into real system events through the `ydotoold` Unix socket.

`ydotoold` creates a virtual input device through `/dev/uinput`. In the current version, the daemon runs directly on the host and creates `runtime/ydotool.sock`, a Unix datagram socket that the container mounts at `/run/tv-remote/ydotool.sock`.

The backend does not need to execute the `ydotool` command for every movement. Instead, it sends Linux `input_event` messages directly to the `ydotoold` socket, so Ubuntu receives them as if they came from a physical mouse or keyboard.

This provides control over:

- mouse movement;
- left and right clicks;
- scrolling;
- arrow keys;
- Enter;
- Escape;
- Space for play and pause;
- Tab;
- Backspace and Delete;
- volume and mute;
- text input.

Text input is handled slightly differently: rather than going through `ydotoold`, it is sent directly to Chrome over CDP.

The joystick also tries not to send hundreds of requests when the connection is slow. Pending movements are grouped together, and any that are no longer useful are discarded when the joystick is released.

Realistically, the joystick experience is pretty dreadful because of the delay. Fortunately, the buttons and direct Chrome actions—going back, reloading, entering fullscreen or closing pop-ups—mean that I rarely need it.

# Automating everything

The technical pieces are interesting, but for the project to be genuinely useful, the laptop must remain connected to the TV and always be ready.

Having to run `docker compose up`, open Chrome, start `ydotoold` and configure ports every time would be such a nuisance that I would never use it. I therefore ended up using `systemd` and Ubuntu's automatic startup to launch all the required components.

The input daemon runs as a service:

```text
tv-remote-ydotoold.service
```

This service loads `/dev/uinput` and starts the version of `ydotoold` installed at:

```text
/usr/local/bin/ydotoold
```

Docker uses:

```yaml
restart: unless-stopped
```

to bring the backend back automatically.

Chrome is added to the Ubuntu graphical session's startup through a `.desktop` file, which runs `scripts/start-browser.sh` in fullscreen mode.

The final goal is simple:

```text
turn on laptop
      ↓
Ubuntu starts
      ↓
ydotoold + Docker
      ↓
FastAPI
      ↓
graphical session starts
      ↓
Chrome
      ↓
pick up the phone and use the TV
```

# Various problems

As with everything in my life, nothing worked on the first try.

One of the biggest sources of trouble was the damned `ydotool`. Ubuntu shipped a rather old version of `ydotoold`, version `0.1.8`, which immediately crashed with a segmentation fault when the backend connected.

The logs were quite beautiful:

```text
ydotoold: accepted client
Main process exited, code=dumped, status=11/SEGV
```

The eventual solution was to use a modern release of `ydotool`—`ydotoold` 1.x in this case—adapt the communication to Unix datagram sockets and keep the daemon running directly on the host.

The current backend talks directly to that socket by sending native Linux events, while Docker merely mounts the `runtime/` directory containing the socket.

I also had to wrestle with Docker installed through Snap, permissions on `/var/run/docker.sock`, sockets shared between the host and container, and a few Wayland quirks.

Docker Snap has another peculiarity: the project must live inside the user's home directory for the `runtime` directory to mount correctly.

And because this laptop has an Intel Ivy Bridge chip that probably witnessed the birth of half of modern JavaScript, Chrome cheerfully warns that some hardware-acceleration technologies are too new for it.

But it works.

# Result

In the end, I turned a dust-gathering Lenovo G580 into an extremely homemade Chromecast.

From my phone, I can open a website, move the pointer, click, scroll, type, control the volume and operate the browser's main functions without going near the laptop.

Perhaps the best part is that nearly the entire system is built with fairly simple tools:

```text
Ubuntu
Docker
FastAPI
Playwright
Chrome DevTools Protocol
ydotoold
/dev/uinput
systemd
HTML / CSS / JavaScript
```

It was not a project I had planned or something I particularly needed. It grew out of one of those small, absurd everyday problems that make a perfect excuse for building an unnecessarily complex architecture.

Now our ancient television is like a man having a midlife crisis and convincing himself that he is a brand-new person.

## Source code

The complete project, including installation and usage instructions, is available on GitHub: [seryio2004/tv-reomote](https://github.com/seryio2004/tv-reomote).
