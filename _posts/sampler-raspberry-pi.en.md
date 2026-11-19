---
title: "DIY sampler with Raspberry Pi, 3D printing and C"
section: "Electronics"
language: "en"
excerpt: "How I built a DIY sampler with a Raspberry Pi 3B, LEDs and buttons on 3D-printed parts, an Arduino for the knobs and my own audio engine in C."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-11-19T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

I had wanted a little machine for making beats with my hands for a while: hit a pad, program a few steps, add a bassline and wreck it all with effects. Instead of buying one, I did what I always do: looked at what I had lying around and thought "I can build this".

The result is this sampler: a Raspberry Pi 3B, 16 LEDs in a row wired as a 4×4 matrix, nine buttons, a 16×2 LCD, an Arduino acting as an expansion module for three potentiometers and two extra buttons, and a 3D-printed case. Inside runs an audio engine I wrote myself in C.

![Front view of the DIY sampler: row of 16 LEDs, nine mechanical keys and LCD in the 3D-printed case](/assets/blog/sampler-raspberry-pi/sampler-terminado.webp)

The most interesting part of the project is not the device itself, but everything it forced me to learn along the way: basic electronics, designing parts for 3D printing and writing C that has to produce sound without dropouts. This article is that journey, roughly in the order I ran into each problem.

## What it does

Before getting into the wiring, here is what it can do:

- Nine pads that trigger samples (WAV or MP3, up to 30 seconds).
- A 16-step sequencer, which is exactly what the LED row shows.
- A synthesized bass programmed on the same 16 steps.
- Two effects in series: filters, distortion, bitcrush, echo, chorus, flanger…
- Momentary effects for live play: repeats, reverse, tape stop, glitch…
- Example kits: a 124 BPM house kit, a CC0-licensed TR-808 bank and a folder of weird sounds.

![Demo video of the DIY sampler in action](/assets/blog/sampler-raspberry-pi/video-explicativo.mp4)

## What I had at home

I set myself one rule from the start: the first prototype is built from whatever is in the drawers. No ordering parts until I know what works and what does not.

```
Raspberry Pi 3B            → brain and audio output
16 LEDs + resistors        → step row (a 4×4 matrix inside)
9 mechanical switches      → pads in a 3×3 grid
LCD1602 (HD44780)          → 16×2 character display
Arduino UNO                → knobs and extra buttons
3 potentiometers + 2 buttons
wires, solder and the 3D printer
```

That rule explains most of the odd decisions that follow. For example, there is no real PCB: the "boards" are 3D-printed parts I designed to hold the components and route the wires.

## The LEDs: a row that behaves like a matrix

The first serious problem was arithmetic. I wanted 16 LEDs, one per sequencer step. Giving each LED its own GPIO means 16 pins, and the Raspberry Pi already needed pins for the buttons and the display.

On the case the 16 LEDs sit in a single row above the buttons. Electrically, though, they are not wired as a row but as a 4×4 matrix: they are split into four groups, the anodes of each group share one pin, and the cathodes are joined by column to four more. Every LED is the crossing of a group and a column, and with 4 + 4 = 8 pins you control all 16.

```
What you see (a row):

  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●

How it is wired (a matrix):

             C1    C2    C3    C4    (cathodes, with resistor)
GROUP 1 ──── ● ─── ● ─── ● ─── ●
GROUP 2 ──── ● ─── ● ─── ● ─── ●
GROUP 3 ──── ● ─── ● ─── ● ─── ●
GROUP 4 ──── ● ─── ● ─── ● ─── ●
(anodes)
```

A row on the outside, a matrix on the inside. The program does not care where each LED physically sits: it only knows which group and which column to drive to light it.

For this to work you need to wire the 16 LEDs in a line with their legs joined by group and by column, and that is where the first printed part comes in: a strip-shaped plastic "PCB" I designed with holes for the 16 LEDs and slots for those connections. Every LED stays in place and the wiring does not turn into a bird's nest.

![3D-printed strip for the 16 LEDs, with group and column wiring at the back](/assets/blog/sampler-raspberry-pi/matriz-led-impresa.webp)

![Printed PCB for the 16 LEDs](/assets/blog/sampler-raspberry-pi/modelos/pcb-leds.stl)

The trick with a matrix is that **only one group is lit at a time**. The program drives group 1 with the right columns, waits a millisecond, turns it off, moves to group 2… over and over. That is 250 full scans per second, and your eye sees the whole row lit at once.

Order matters here. If you change the columns while the previous group is still on, a ghost LED lights up for an instant. That is why the scan always follows the same sequence: groups off, set columns, then turn on exactly one group. In the code the groups are called `rows`, because electrically they are the rows of the matrix:

```c
/* Break before make: rows OFF -> column data -> exactly one row ON. */
if (!set(h->leds,LED_ROWS,0) || !set(h->leds,LED_COLS,bits)
    || (bits!=LED_COLS && !set(h->leds,LED_ROWS,1ULL<<row))) {
    atomic_store(&h->failed,true); break;
}
```

This runs in its own thread with an absolute timer (`clock_nanosleep`), so the scan rate does not depend on what the rest of the program is doing. If the system stalls for a moment, the thread does not try to catch up by racing through groups: it just carries on from now.

## The buttons and the "PCB" with wires inside

The nine pads are mechanical keyboard switches, Epomaker Flamingos with their keycaps on. Electrically they behave like any push button, so the design is much simpler: each one sits between a GPIO and ground, and the Raspberry Pi enables its internal pull-up resistors. If the pin reads 0, the button is pressed.

That means all nine buttons share the same negative. To avoid nine loose splices, I designed another 3D-printed part for the 3×3 grid and, during the print, embedded the wires inside the part itself to join every negative. It is about as close to a PCB as you can get with a printer and patience.

![Inside the lid: wiring for the button grid and the back of the LCD](/assets/blog/sampler-raspberry-pi/botones-impresos.webp)

If you look closely at this photo and the one of the LED strip, the soldering is neither the best nor the most efficient: some joints have more solder than they need and some wires take longer routes than they should. It was what I came up with when I built it, using what I had at hand, and it works, but it is one of the things I want to do better in the next version.

![Printed PCB for the 3×3 button grid](/assets/blog/sampler-raspberry-pi/modelos/pcb-botones.stl)

```
Top      GPIO 5  · pad 7    GPIO 6  · pad 8    GPIO 12 · pad 9
Middle   GPIO 13 · pad 1    GPIO 16 · pad 2    GPIO 19 · pad 3
Bottom   GPIO 20 · pad 4    GPIO 21 · pad 5    GPIO 26 · pad 6
         (other terminal of every button to a shared GND)
```

## The Arduino as an expansion module

Then came another discovery: **the Raspberry Pi has no analog inputs**. It can tell whether a pin is 0 or 1, but not where a potentiometer is turned.

Since I had an Arduino UNO at home, I turned it into an expansion module. The Arduino reads the three potentiometers and the OK and FN buttons, and every 20 ms sends one line of text over USB to the Raspberry Pi:

```
CTRL 512 1023 0 1 0
     │   │    │ │ └── FN
     │   │    │ └──── OK
     │   │    └────── potentiometer A2
     │   └─────────── potentiometer A1
     └─────────────── NAV (A0)
```

Going over USB is not just convenient, it is also a safety decision: the Arduino runs at 5 V and the Raspberry Pi GPIOs at 3.3 V. Wiring them together directly is a great way to kill the Pi.

The module has its own printed enclosure, separate from the main one: a base that holds the Arduino, with an opening for the USB port, and a lid with three holes for the potentiometers and two windows for the OK and FN buttons. Inside is another printed "PCB", this time a power strip: 5 V with three outputs for the potentiometers and GND with five, for the potentiometers and the two buttons. The OK and FN buttons use the same Epomaker Flamingo switches as the pads, with their keycaps. The knobs are printed too.

The Arduino does some signal cleanup: it discards the first ADC reading after switching pins, smooths each potentiometer value and debounces the buttons for 25 ms. On the Raspberry Pi side is the part that took the most tuning: **pickup**. If you saved a tempo of 124 BPM and the knob is physically at minimum, touching it would make the tempo jump. To avoid that, the program does not apply the value until the knob "passes through" the saved value, and meanwhile the display shows an arrow telling you which way to turn.

![USB-connected expansion module with three potentiometers and the OK and FN mechanical keys](/assets/blog/sampler-raspberry-pi/modulo-expansion-arduino.webp)

![Expansion module lid, with openings for the potentiometers and buttons](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-tapa.stl)

![Expansion module base, which holds the Arduino](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-base.stl)

![Printed 5 V and GND power strip for the expansion module](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-regleta.stl)

![Three 3D-printed knobs for the expansion module potentiometers](/assets/blog/sampler-raspberry-pi/perillas-impresas.webp)

![Printed knob for the potentiometers](/assets/blog/sampler-raspberry-pi/modelos/perilla.stl)

With the Arduino connected, all nine buttons are sound pads. Without it, the top row becomes left, OK and right, and the sampler still works with six pads.

## The case

With everything working on the desk, it needed a home. I also designed and printed the case, in two parts. The top has the grid for the nine buttons, the display window and the row of 16 holes for the LEDs. The base is a box where the Raspberry Pi is screwed in, with openings for its connectors.

If you look closely at the top, you will see two knob holes with nothing in them. I designed it before discovering that the Raspberry Pi has no analog inputs, back when I still thought the potentiometers would go there. By the time I noticed, the top was already printed, the potentiometers ended up in the expansion module and the holes stayed as a souvenir of the mistake. If anyone wants to print it, write to me and I will send you a corrected STL without them.

![Side view of the 3D-printed case with the display, LEDs and nine mechanical keys installed](/assets/blog/sampler-raspberry-pi/carcasa.webp)

![Top of the case, with the two knob holes from before I found out about the analog inputs](/assets/blog/sampler-raspberry-pi/modelos/carcasa-superior.stl)

![Case base, which holds the Raspberry Pi](/assets/blog/sampler-raspberry-pi/modelos/carcasa-base.stl)

## From a Python prototype to an audio engine in C

The first version of the program was Python with `pygame.mixer` at 22,050 Hz. It proved that the buttons, LEDs and sequencer worked, but it fell short of what I wanted to do with the sound: effects were applied to each note separately, not to the whole mix. There was no way to run the whole beat through a filter and slowly open it, which is exactly the fun part.

So I rewrote the engine in C. That first demo is still in the repository because it is part of the journey.

An audio engine is simpler than it sounds and trickier than it sounds. You have to hand the sound card 44,100 numbers per second, always on time. If a block arrives late, you hear a click. Each of those numbers is the sum of everything playing at that instant:

```
32 voices (samples + synthesized bass)
        │ sum
        ▼
      FX1 → FX2 → momentary effect → volume → limiter
                                                │
                                                ▼
                                 ALSA (16-bit, 44,100 Hz)
```

A few things I learned writing it:

- **Cutting a sound abruptly clicks.** If a voice stops dead because another one takes its place, the waveform jumps and you hear it. Every voice has a half-millisecond attack and a 2 ms release, and a replaced voice leaves a very short tail that fades out.
- **Adding voices clips.** With many hits at once the sum goes over the maximum. Instead of hard clipping, a limiter looks 3 ms ahead and lowers the volume slightly before the peak arrives.
- **The audio thread is sacred.** Loading an MP3 or resampling a sample happens outside the audio thread. The thread that feeds ALSA only computes and delivers blocks, with a 60 ms buffer.
- **The LEDs must follow what you hear, not what has been computed.** The engine renders audio a little before it reaches the speaker. If the LEDs followed the engine, they would run ahead of the sound. The program asks ALSA how many frames have actually been played and lights the LEDs from that.

I did not use any library for the GPIOs: the program talks directly to the kernel's character device interface (`/dev/gpiochip0`) through `ioctl`. The LCD runs in 4-bit mode and, since the controller lets you define eight custom characters, I use them as bars of different heights to draw the waveform of the sample you are previewing.

Something that has saved me several times is testing with simulated hardware. There is a fake GPIO and a fake ALSA, so `make test` checks the engine, the controls and the Arduino sketch on my laptop without the Raspberry Pi.

## Assorted problems

As usual, nothing worked the first time.

**The noise.** The most stubborn problem was a layer of noise on every sound through the 3.5 mm jack. The odd part was that playing a file with `aplay` was clean, and running the sampler without GPIO had less noise but still clicked. That forced me to separate two problems: the clicks came largely from the engine itself (abruptly cut voices and mix clipping), which is why I added the fades and the limiter. The rest points to the analog stage and the power shared with the LEDs and display. I have not pinned down a single definitive cause, but the program has options (`--no-leds`, `--no-lcd`, `--headless`) to isolate each part.

**Jumping knobs.** Without pickup, every screen change was a scare: volume or tempo jumped to wherever the knob happened to be.

**The serial monitor.** If the Arduino IDE serial monitor is open, the sampler cannot read the port. You have to close it before starting.

**Forbidden pins.** The LED GPIOs must be free of other functions such as SPI or UART, so not just any spare pin on the board will do.

## What comes next: an ESP32

This first prototype works, but it has its limits. It depends on a Raspberry Pi running Linux, an Arduino hanging off USB and everything booting correctly. And to be honest, on the Raspberry Pi my C runs on top of a full operating system: it is systems programming, but not truly embedded yet.

I am now waiting for parts for the next version, based on an **ESP32** and without Linux:

- A **4×4 button matrix**, one button per step, instead of the 3×3 grid.
- A **4×4 LED matrix**.
- **8 knobs**, instead of the Arduino's three potentiometers.
- Several function buttons.
- An **OLED display** to draw waveforms, show effects and everything that does not fit on the LCD's two lines.

The challenge will be bringing the audio engine to a microcontroller with far less memory and no operating system to do the dirty work for me. I will write about it here when it arrives.

## Result

I ended up with an instrument that works offline, starts with one command and lets me program a beat, add a bassline and run it all through a filter by turning a knob. All from parts I had at home and a fair amount of printer time.

```
Raspberry Pi 3B · Raspberry Pi OS
C11 · ALSA · libsndfile · libmpg123 · libsamplerate · json-c
Kernel GPIO (gpiochip v2)
Arduino UNO over USB serial
LCD1602 · 16 LEDs in a row, multiplexed as a 4×4 matrix
Self-designed 3D-printed parts
```

The best part has been learning a little of everything: why a ghost LED lights up where it should not, how to read a potentiometer without jitter, how to design a part so the wires go inside it, and why a sound that stops abruptly clicks.

### Source code

The code, the Arduino sketch, the example kits and the full wiring guide are on GitHub: [seryio2004/sampler](https://github.com/seryio2004/sampler). The repository documentation is in Spanish.

If you like giving old hardware a second life, I also turned an old laptop into a [phone-controlled TV remote](/en/posts/linux-tv-remote/). And if you prefer projects that stay on at home, here is how I built my [home server with Docker, Tailscale and Nextcloud](/en/posts/servidor-personal-nextcloud-tailscale/).
