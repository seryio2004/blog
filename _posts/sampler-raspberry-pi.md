---
title: "Sampler casero con Raspberry Pi, impresión 3D y C"
section: "Electrónica"
language: "es"
excerpt: "Cómo construí un sampler casero con una Raspberry Pi 3B, LED y botones sobre piezas impresas en 3D, un Arduino para los mandos y un motor de audio propio en C."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-11-19T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

Llevaba tiempo con ganas de tener una maquinita para hacer ritmos con las manos: pulsar un pad, escribir unos pasos, meter un bajo y destrozarlo todo con efectos. Tengo un Pocket Operator de Teenage Engineering que me enamoró por su estética, y buena parte de las ganas de hacer este proyecto vienen de ahí. También he podido usar varias veces un Digitakt de Elektron, que me sirvió de inspiración para imaginar lo que me gustaría hacer con mi propio sampler.

El problema es que no tengo dinero para comprarme ni el sampler de Teenage Engineering ni un Digitakt. Así que, entre las ganas de tener algo así y la curiosidad por entender cómo funciona por dentro, hice lo que hago siempre: mirar lo que tenía por casa y pensar "esto lo monto yo".

El resultado es este sampler: una Raspberry Pi 3B, 16 LED en fila cableados como una matriz de 4×4, nueve botones, una pantalla LCD de 16×2, un Arduino haciendo de módulo de expansión para tres potenciómetros y dos botones más, y una carcasa impresa en 3D. Por dentro corre un motor de audio que he escrito yo en C.

![Vista frontal del sampler casero: fila de 16 LED, nueve teclas mecánicas y pantalla LCD en la carcasa impresa en 3D](/assets/blog/sampler-raspberry-pi/sampler-terminado.webp)

Lo más interesante del proyecto no es el aparato en sí, sino todo lo que me ha obligado a aprender por el camino: electrónica básica, diseñar piezas para imprimir en 3D y programar en C algo que tiene que generar sonido sin cortarse. Este artículo es el recorrido, más o menos en el orden en que me fui pegando con cada cosa.

## Qué hace

Antes de entrar en los cables, lo que se puede hacer con él:

- Nueve pads que disparan muestras (WAV o MP3, hasta 30 segundos).
- Un secuenciador de 16 pasos, que es justo lo que muestra la fila de LED.
- Un bajo sintetizado que se programa en los mismos 16 pasos.
- Dos efectos en serie: filtros, distorsión, bitcrush, eco, chorus, flanger…
- Efectos momentáneos para tocar en directo: repeticiones, reverse, tape stop, glitch…
- Kits de ejemplo: un house a 124 BPM, un banco TR-808 con licencia CC0 y una carpeta de sonidos raros.

![Vídeo de demo del sampler casero en funcionamiento](/assets/blog/sampler-raspberry-pi/video-explicativo.mp4)

## Cómo hago un ritmo con él

Con todo montado, lo primero que apetece es escuchar algo. Para esta primera vuelta uso el kit house que viene en el repositorio, con sus sonidos y un patrón a 124 BPM. Lo arranco desde la carpeta del proyecto:

```bash
./sampler-c --samples ./samples --state kits/house.json --no-save --arduino /dev/ttyACM0
```

Ese `--no-save` es para jugar sin machacar el kit de ejemplo. Para guardar lo que vaya haciendo, hago una copia del JSON y arranco con esa copia, quitando la opción. El programa va guardando los patrones y los ajustes; no tengo que reconstruir el ritmo cada vez que lo enciendo.

La forma de moverse es bastante sencilla una vez que te quedas con el truco: mantengo OK unos 0,65 segundos para abrir el menú, giro NAV para elegir pantalla y pulso OK corto para entrar. En **PATRONES**, NAV elige uno de los 16 pasos y el segundo potenciómetro elige el sonido. OK pone o quita un golpe. Para probar desde un patrón vacío, un bombo en 1, 5, 9 y 13 y una caja en 5 y 13 ya dan algo sobre lo que seguir jugando. En **TEMPO**, OK arranca o para la reproducción y NAV cambia la velocidad.

Después paso a **BAJO**: sigo eligiendo el paso con NAV, pero ahora el tercer potenciómetro elige la nota que voy a poner. Y cuando ya hay algo sonando, viene lo divertido: entrar en **EFECTOS**, elegir un filtro y confirmarlo con OK. Los otros dos mandos pasan a controlar sus parámetros. Con FN y OK corto cambio entre FX1 y FX2, así que puedo dejar el filtro en uno y un eco en el otro. Si mantengo FN y pulso un pad dentro de esa pantalla, entra un efecto momentáneo; al soltarlo, vuelvo al ritmo.

Para meter mis propios sonidos, copio WAV o MP3 a `samples/`. Desde **SAMPLES** puedo recorrer las carpetas, preescuchar con FN y cargar el archivo con OK en el pad elegido. Aquí el sampler trabaja con archivos preparados: esta es la manera de traer sonidos de fuera al instrumento. Los controles completos están en la [guía de uso del repositorio](https://github.com/seryio2004/sampler/blob/main/GUIA_DE_USO.md).

## Lo que tenía por casa

Una regla que me puse desde el principio: el primer prototipo se hace con lo que haya en los cajones. Nada de pedir componentes hasta saber qué funciona y qué no.

```
Raspberry Pi 3B            → cerebro y salida de audio
16 LED + resistencias      → fila de pasos (matriz 4×4 por dentro)
9 switches mecánicos       → pads en cuadrícula 3×3
LCD1602 (HD44780)          → pantalla de 16×2 caracteres
Arduino UNO                → potenciómetros y botones extra
3 potenciómetros + 2 botones
cables, estaño y la impresora 3D
```

Esa regla condiciona casi todas las decisiones raras que vienen después. Por ejemplo, no hay PCB de verdad: las "placas" son piezas impresas en 3D que diseñé yo para sujetar los componentes y guiar los cables.

## Los LED: una fila que se comporta como matriz

El primer problema serio fue matemático. Quería 16 LED, uno por paso del secuenciador. Si cada LED va a su propio GPIO, son 16 pines, y la Raspberry ya los necesitaba para los botones y la pantalla.

En la carcasa los 16 LED van en una sola fila, encima de los botones. Pero eléctricamente no están cableados como una fila, sino como una matriz de 4×4: se reparten en cuatro grupos, los ánodos de cada grupo van unidos a un pin y los cátodos se unen por columnas a otros cuatro. Cada LED es el cruce de un grupo y una columna, y con 4 + 4 = 8 pines controlas los 16.

```text
Pieza impresa: 16 posiciones en una tira
  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●

Conexiones lógicas del programa (GPIO BCM):
                         C1   C2   C3   C4
                         │    │    │    │
G1 · GPIO 7  · ánodos     01   02   03   04
G2 · GPIO 4  · ánodos     05   06   07   08
G3 · GPIO 8  · ánodos     09   10   11   12
G4 · GPIO 9  · ánodos     13   14   15   16
                         │    │    │    │
Cátodos por columna      R    R    R    R
                         │    │    │    │
GPIO BCM                10   11   18   15
```

Los números son los LED lógicos del código, no pines del conector. Cada uno une el ánodo de su grupo con el cátodo de su columna; las cuatro `R` son las resistencias limitadoras, una por columna. El README propone 1 kΩ por columna como punto de partida para las pruebas. El STL de la tira permite ver los alojamientos y las guías, pero el orden eléctrico lo determina el cableado. Para comprobar qué posición física corresponde a cada número está `./sampler-c --test-leds`, ejecutado con el sampler cerrado.

Una fila por fuera y una matriz por dentro. Al programa le da igual dónde esté colocado cada LED: solo sabe qué grupo y qué columna tiene que activar para encenderlo.

Para que esto funcione necesitas cablear los 16 LED en línea con las patas unidas por grupos y por columnas, y ahí entra la primera pieza impresa: una "PCB" de plástico en forma de tira que diseñé con los huecos para los 16 LED y las ranuras por donde pasan esas uniones. Así cada LED queda en su sitio y el cableado no es un nido de pájaros.

![Tira impresa en 3D para los 16 LED, con el cableado de grupos y columnas por detrás](/assets/blog/sampler-raspberry-pi/matriz-led-impresa.webp)

![PCB impresa para los 16 LED](/assets/blog/sampler-raspberry-pi/modelos/pcb-leds.stl)

El truco de la matriz es que **solo se enciende un grupo a la vez**. El programa activa el grupo 1 con las columnas que tocan, espera un milisegundo, lo apaga, pasa al grupo 2… y así continuamente. Son 250 barridos completos por segundo, y tu ojo ve toda la fila encendida a la vez.

Aquí el orden importa. Si cambias las columnas mientras el grupo anterior sigue activo, durante un instante se ilumina un LED fantasma. Por eso el barrido sigue siempre el mismo orden: apagar los grupos, poner las columnas y activar un solo grupo. En el código los grupos se llaman `rows`, porque eléctricamente son las filas de la matriz:

```c
/* Break before make: rows OFF -> column data -> exactly one row ON. */
if (!set(h->leds,LED_ROWS,0) || !set(h->leds,LED_COLS,bits)
    || (bits!=LED_COLS && !set(h->leds,LED_ROWS,1ULL<<row))) {
    atomic_store(&h->failed,true); break;
}
```

Esto corre en su propio hilo, con un temporizador absoluto (`clock_nanosleep`) para que el ritmo del barrido no dependa de lo que esté haciendo el resto del programa. Y si el sistema se atasca un momento, el hilo no intenta recuperar el tiempo perdido barriendo grupos a toda velocidad: simplemente sigue desde ahora.

## Los botones y la "PCB" con los cables dentro

Los nueve pads son switches mecánicos de teclado, unos Epomaker Flamingo con sus teclas puestas. Eléctricamente se comportan como cualquier pulsador, así que el diseño es mucho más sencillo: cada uno va entre un GPIO y masa (GND), y la Raspberry activa sus resistencias pull-up internas. Si el pin lee 0, el botón está pulsado.

Eso significa que los nueve botones comparten el mismo negativo. Para no hacer nueve empalmes al aire, diseñé otra pieza impresa en 3D para la cuadrícula de 3×3, y durante la impresión metí los cables dentro de la propia pieza para unir todos los negativos. Es lo más parecido a una PCB que puedes hacer con una impresora y paciencia.

![Interior de la tapa: cableado de la cuadrícula de botones y parte trasera de la pantalla LCD](/assets/blog/sampler-raspberry-pi/botones-impresos.webp)

Si te fijas en esta foto y en la de la tira de LED, las soldaduras no son las mejores ni las más eficientes: hay uniones con más estaño del necesario y cables que dan más vueltas de las que deberían. Fue lo que se me ocurrió en el momento de montarlo, con lo que tenía a mano, y funciona, pero es una de las cosas que quiero hacer mejor en la próxima versión.

![PCB impresa para la cuadrícula de 3×3 botones](/assets/blog/sampler-raspberry-pi/modelos/pcb-botones.stl)

Todos los GPIO de estos esquemas usan **numeración BCM**, no el número físico del conector. La numeración de pads de abajo sigue el código actual (`hardware.c` y `main.c`); el README conserva otra numeración.

```text
Superior   GPIO 5  · pad 1    GPIO 6  · pad 2    GPIO 12 · pad 3
Central    GPIO 13 · pad 4    GPIO 16 · pad 5    GPIO 19 · pad 6
Inferior   GPIO 20 · pad 7    GPIO 21 · pad 8    GPIO 26 · pad 9
           (todos con el otro terminal a GND común)
```

La pieza `pcb-botones.stl` tiene los nueve alojamientos y un recorrido en zigzag entre las filas. El esquema eléctrico de cada pulsador es el mismo, aunque el cable de masa dé todas esas vueltas dentro del plástico:

```text
          Raspberry Pi
3,3 V ── pull-up interna
                 │
GPIO de entrada ─┴──── o   o ──── GND común
                       pulsador
                       (abierto)

Sin pulsar → 1       Al cerrar contra GND → 0
Repetido nueve veces, con un GPIO por botón.
```

## El Arduino como módulo de expansión

Aquí llegó otro descubrimiento: **la Raspberry Pi no tiene entradas analógicas**. Puede leer si un pin está a 0 o a 1, pero no la posición de un potenciómetro.

Como tenía un Arduino UNO por casa, lo convertí en un módulo de expansión. El Arduino lee los tres potenciómetros y los botones OK y FN, y cada 20 ms manda una línea de texto por USB a la Raspberry:

```
CTRL 512 1023 0 1 0
     │   │    │ │ └── FN
     │   │    │ └──── OK
     │   │    └────── potenciómetro A2
     │   └─────────── potenciómetro A1
     └─────────────── NAV (A0)
```

Ir por USB no es solo cómodo, también es una decisión de seguridad: el Arduino trabaja a 5 V y los GPIO de la Raspberry a 3,3 V. Conectarlos directamente es una forma estupenda de cargarte la Raspberry.

El módulo tiene su propia caja impresa, separada de la principal: una base donde va el Arduino, con hueco para el USB, y una tapa con tres agujeros para los potenciómetros y dos ventanas para los botones OK y FN. Dentro hay otra "PCB" impresa, esta vez una regleta: 5 V con tres salidas para los potenciómetros y GND con cinco, para los potenciómetros y los dos botones. Los botones OK y FN son los mismos switches Epomaker Flamingo que los pads, con sus teclas. Las perillas también son impresas.

En el STL de la regleta se distinguen los dos repartidores, incluso con sus etiquetas: «+5V 3 SALIDAS» y «GND 5 SALIDAS». Eso encaja con lo que necesita el sketch: tres potenciómetros y dos pulsadores. El dibujo resume las conexiones; no representa el orden físico de las patillas visto desde detrás:

```text
Arduino UNO
  5 V ── regleta ──┬── extremo del potenciómetro NAV
                   ├── extremo del potenciómetro A1
                   └── extremo del potenciómetro A2

  GND ── regleta ──┬── otro extremo de NAV
                   ├── otro extremo del potenciómetro A1
                   ├── otro extremo del potenciómetro A2
                   ├── pulsador OK ── D2
                   └── pulsador FN ── D3

  A0 ◄── terminal central de NAV
  A1 ◄── terminal central del segundo potenciómetro
  A2 ◄── terminal central del tercer potenciómetro

Raspberry Pi ◄──── USB / serie ────► Arduino UNO
                  115200 baudios
```

Del lado del Arduino hay un poco de limpieza de señal: se descarta la primera lectura del conversor al cambiar de pin, se suaviza el valor de cada potenciómetro y los botones tienen un antirrebote de 25 ms. Del lado de la Raspberry está lo que más me costó afinar, la **recogida**. Si guardas un tempo de 124 BPM y el potenciómetro está físicamente al mínimo, al tocarlo el tempo pegaría un salto. Para evitarlo, el programa no aplica el valor hasta que el potenciómetro "pasa" por el valor guardado, y mientras tanto la pantalla te indica con una flecha hacia dónde girar.

![Módulo de expansión conectado por USB, con tres potenciómetros y las teclas mecánicas OK y FN](/assets/blog/sampler-raspberry-pi/modulo-expansion-arduino.webp)

![Tapa del módulo de expansión, con los huecos de los potenciómetros y los botones](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-tapa.stl)

![Base del módulo de expansión, donde va el Arduino](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-base.stl)

![Regleta impresa de 5 V y GND del módulo de expansión](/assets/blog/sampler-raspberry-pi/modelos/modulo-expansion-regleta.stl)

![Tres perillas impresas en 3D para los potenciómetros del módulo de expansión](/assets/blog/sampler-raspberry-pi/perillas-impresas.webp)

![Perilla impresa para los potenciómetros](/assets/blog/sampler-raspberry-pi/modelos/perilla.stl)

Con el Arduino conectado, los nueve botones son pads de sonido. Sin él, la fila de arriba pasa a ser izquierda, OK y derecha, y el sampler se puede seguir usando con seis pads.

## La carcasa

Con todo funcionando encima de la mesa, faltaba meterlo en algo. La carcasa también la diseñé e imprimí yo, en dos partes. La tapa superior tiene la cuadrícula para los nueve botones, la ventana de la pantalla y la fila de 16 agujeros para los LED. La base es una caja donde va atornillada la Raspberry, con aberturas para sus conectores.

Si te fijas en la tapa, verás dos huecos para perillas que no llevan nada. La diseñé antes de descubrir que la Raspberry no tiene entradas analógicas, cuando todavía pensaba que los potenciómetros irían ahí. Cuando me di cuenta la tapa ya estaba impresa, los potenciómetros acabaron en el módulo de expansión y los huecos se quedaron como recuerdo del error. Si alguien quiere imprimirla, que me escriba y le paso un STL corregido sin ellos.

![Vista lateral de la carcasa impresa en 3D con la pantalla, los LED y las nueve teclas mecánicas montadas](/assets/blog/sampler-raspberry-pi/carcasa.webp)

![Tapa superior de la carcasa, con los dos huecos para perillas de antes de descubrir lo de las entradas analógicas](/assets/blog/sampler-raspberry-pi/modelos/carcasa-superior.stl)

![Base de la carcasa, donde va la Raspberry Pi](/assets/blog/sampler-raspberry-pi/modelos/carcasa-base.stl)

## Del prototipo en Python al motor de audio en C

La primera versión del programa la hice en Python con `pygame.mixer`, a 22.050 Hz. Sirvió para comprobar que los botones, los LED y el secuenciador funcionaban, pero se quedaba corta para lo que quería hacer con el sonido: los efectos se aplicaban a cada nota por separado, no a la mezcla completa. No había forma de pasar todo el ritmo por un filtro y abrirlo poco a poco, que es justo lo divertido.

Así que reescribí el motor en C. Esa primera demo sigue en el repositorio porque es parte del camino.

La idea de un motor de audio es más sencilla de lo que parece y más puñetera de lo que parece. Hay que entregar a la tarjeta de sonido 44.100 números por segundo, siempre a tiempo. Si un bloque llega tarde, se oye un chasquido. Cada uno de esos números es la suma de todo lo que suena en ese instante:

```
32 voces (muestras + bajo sintetizado)
        │ suma
        ▼
      FX1 → FX2 → efecto momentáneo → volumen → limitador
                                                  │
                                                  ▼
                                   ALSA (16 bits, 44.100 Hz)
```

Algunas cosas que aprendí escribiéndolo:

- **Cortar un sonido de golpe hace "clic".** Si una voz se corta en seco porque entra otra, la onda pega un salto y se oye. Cada voz tiene una entrada de medio milisegundo y una salida de 2 ms, y cuando una voz se sustituye deja una cola muy corta que se desvanece.
- **Sumar voces satura.** Con muchos golpes a la vez la suma se pasa del máximo. En vez de recortar a lo bruto, hay un limitador que mira 3 ms hacia delante y baja el volumen un poco antes de que llegue el pico.
- **El hilo de audio es sagrado.** Cargar un MP3 o convertir la frecuencia de una muestra se hace fuera del hilo de audio. El hilo que alimenta a ALSA solo calcula y entrega bloques, con un buffer de 60 ms.
- **Los LED tienen que ir con lo que suena, no con lo que se ha calculado.** El motor calcula el audio un poco antes de que salga por el altavoz. Si los LED siguiesen al motor, irían adelantados al sonido. El programa le pregunta a ALSA cuántos frames se han reproducido de verdad y enciende los LED según eso.

Para controlar los GPIO no usé ninguna librería: el programa habla directamente con la interfaz de caracteres del kernel (`/dev/gpiochip0`) mediante `ioctl`. La pantalla LCD va en modo de 4 bits y, como el controlador permite definir ocho caracteres propios, los uso como barras de distintas alturas para dibujar la forma de onda de la muestra que estás escuchando.

Las seis señales de la pantalla salen también de `hardware.c`. Así queda esa parte del cableado, separada de la alimentación y del ajuste de contraste del módulo:

```text
Raspberry Pi (BCM)       LCD1602
       GPIO 17 ───────── RS
       GPIO 27 ───────── E
       GPIO 22 ───────── D4
       GPIO 23 ───────── D5
       GPIO 24 ───────── D6
       GPIO 25 ───────── D7
           GND ───────── RW y VSS
                         D0–D3 sin usar
```

El esquema muestra las señales del modo de 4 bits; VDD, contraste y retroiluminación se conectan según el módulo concreto. Para preparar estos dibujos he usado las piezas STL de arriba y las asignaciones de [GPIO del programa](https://github.com/seryio2004/sampler/blob/main/src/hardware.c) y del [sketch del Arduino](https://github.com/seryio2004/sampler/blob/main/arduino/sampler_pot/sampler_pot.ino). El plástico ayuda a seguir el montaje, pero las conexiones las fija el circuito.

Un detalle que me ha salvado varias veces son las pruebas con hardware simulado. Hay un GPIO falso y un ALSA falso, así que con `make test` puedo comprobar el motor, los controles y el sketch del Arduino en el portátil sin tener la Raspberry delante.

## Problemas varios

Como siempre, nada salió bien a la primera.

**El ruido.** El problema más pesado fue una capa de ruido sobre todos los sonidos usando el jack de 3,5 mm. Lo raro es que reproduciendo un archivo con `aplay` el ruido no aparecía, y arrancando el sampler sin GPIO había menos ruido, pero quedaban chasquidos. Eso me obligó a separar dos problemas: los chasquidos venían en buena parte del propio motor (voces cortadas de golpe y recortes de la mezcla), y por eso añadí los fundidos y el limitador. El resto apunta a la parte analógica y a la alimentación compartida con los LED y la pantalla. No he dado con una única causa definitiva, pero el programa tiene opciones (`--no-leds`, `--no-lcd`, `--headless`) para ir aislando cada parte.

**Los potenciómetros que saltan.** Sin la recogida, cada cambio de pantalla era un susto: el volumen o el tempo saltaban al valor donde estuviese el mando.

**El monitor serie.** Si tienes abierto el monitor serie del IDE de Arduino, el sampler no puede leer el puerto. Antes de arrancarlo, hay que cerrarlo.

**Los pines prohibidos.** Los GPIO de los LED tienen que estar libres de otros usos como SPI o UART, así que no vale cualquier pin que quede libre en la placa.

## Lo que viene: un ESP32

Este primer prototipo funciona, pero tiene sus límites. Depende de una Raspberry con Linux, de un Arduino colgando por USB y de que todo arranque bien. Ahora quiero llevarlo a un microcontrolador: prescindir de Linux, trabajar con mucha menos memoria y encargarme más directamente de la generación de audio y los periféricos.

Ahora estoy esperando componentes para la siguiente versión, basada en un **ESP32** y sin Linux:

- Una matriz de **4×4 botones**, uno por paso, en lugar de la cuadrícula de 3×3.
- Una matriz de **4×4 LED**.
- **8 perillas**, en lugar de los tres potenciómetros del Arduino.
- Varios botones de función.
- Una **pantalla OLED** donde dibujar la forma de onda, ver los efectos y todo lo que ahora no cabe en las dos líneas del LCD.

También quiero aprovechar esta versión para seguir aprendiendo **FreeRTOS**, porque mis conocimientos actuales son muy, muy básicos. Prescindir de Linux no significa hacerlo todo sin sistema operativo: ESP-IDF integra FreeRTOS, y quiero ir entendiendo cómo repartir el trabajo entre tareas, cómo se comunican y cómo evitar que leer los controles o actualizar la pantalla interrumpa el audio. Me parece una buena excusa para aprenderlo con un aparato que quiero usar. Cuando lleguen los componentes y empiece a pelearme con ello, lo contaré aquí.

## Resultado

He acabado con un instrumento que funciona sin conexión a internet, que arranco con un comando y con el que puedo programar un ritmo, meterle un bajo y pasarlo todo por un filtro girando un mando. Todo con piezas que tenía por casa y unas cuantas horas de impresora.

```
Raspberry Pi 3B · Raspberry Pi OS
C11 · ALSA · libsndfile · libmpg123 · libsamplerate · json-c
GPIO del kernel (gpiochip v2)
Arduino UNO por USB serie
LCD1602 · 16 LED en fila multiplexados como matriz 4×4
Piezas e impresión 3D de diseño propio
```

Lo mejor ha sido aprender un poco de todo: por qué un LED fantasma se enciende donde no toca, cómo se lee un potenciómetro sin que tiemble, cómo se diseña una pieza para que los cables vayan dentro y por qué un sonido que se corta de golpe hace "clic".

Me gustaría seguir haciendo prototipos, aprender de lo que falle en cada uno y, con tiempo, llegar a crear un producto que pueda sacar al mercado. Todavía me queda muchísimo por aprender y este montaje es apenas un primer paso, pero me hace ilusión pensar que algún día alguien pueda hacer música con un instrumento diseñado por mí. De momento, toca seguir probando y conseguir que la siguiente versión sea un poco mejor.

### Código fuente

El código, el sketch del Arduino, los kits de ejemplo y la guía completa de conexiones están en GitHub: [seryio2004/sampler](https://github.com/seryio2004/sampler).

Si te gusta darle una segunda vida a hardware viejo, también convertí un portátil antiguo en un [mando para la tele controlado desde el móvil](/posts/linux-tv-remote/). Y si prefieres los proyectos que se quedan encendidos en casa, aquí cuento cómo monté mi [servidor doméstico con Docker, Tailscale y Nextcloud](/posts/servidor-personal-nextcloud-tailscale/).
