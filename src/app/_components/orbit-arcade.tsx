"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

const meteorites = ["one", "two", "three", "four"] as const;
type MeteorName = typeof meteorites[number];

const alerts = [
  "PUSH A MASTER EN VIERNES",
  "DEPLOY SIN TESTS",
  "FORCE PUSH DETECTADO",
  "HOTFIX SIN ROLLBACK",
  "SECRETOS EN EL COMMIT",
  "DEPENDENCIA SIN FIJAR",
] as const;

type MeteorConfig = {
  generation: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  duration: number;
  delay: number;
  spin: number;
  alert: number;
};

type MeteorStyle = CSSProperties & Record<`--${string}`, string>;

const initialMeteors: Record<MeteorName, MeteorConfig> = {
  one: { generation: 0, startX: 110, startY: 20, endX: 61, endY: 35, size: 44, duration: 7.2, delay: -1.2, spin: 310, alert: 0 },
  two: { generation: 0, startX: 110, startY: 49, endX: 65, endY: 57, size: 36, duration: 8.1, delay: -3, spin: -280, alert: 1 },
  three: { generation: 0, startX: 49, startY: -10, endX: 49, endY: 25, size: 52, duration: 8.8, delay: -4.8, spin: 340, alert: 2 },
  four: { generation: 0, startX: 110, startY: 7, endX: 70, endY: 29, size: 32, duration: 6.7, delay: -6.1, spin: -320, alert: 3 },
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function createRandomMeteor(generation: number, stagger = false): MeteorConfig {
  const entersFromTop = Math.random() < 0.38;
  const duration = randomBetween(6.4, 10.2);

  return {
    generation,
    startX: entersFromTop ? randomBetween(30, 92) : randomBetween(106, 116),
    startY: entersFromTop ? randomBetween(-16, -8) : randomBetween(8, 67),
    endX: randomBetween(49, 73),
    endY: randomBetween(24, 61),
    size: randomBetween(32, 56),
    duration,
    delay: stagger ? -randomBetween(0, duration) : randomBetween(0.25, 1.4),
    spin: randomBetween(-420, 420),
    alert: Math.floor(Math.random() * alerts.length),
  };
}

type Shot = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  hit: boolean;
  impact: boolean;
};

export function OrbitArcade() {
  const gameRef = useRef<HTMLDivElement>(null);
  const meteorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const destroyedRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  const nextShotId = useRef(0);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const pointerStartRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [alertIndex, setAlertIndex] = useState(0);
  const [intercepts, setIntercepts] = useState(0);
  const [destroyed, setDestroyed] = useState<string[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [meteorConfigs, setMeteorConfigs] = useState(initialMeteors);

  useEffect(() => () => {
    timersRef.current.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    setMeteorConfigs(Object.fromEntries(
      meteorites.map(name => [name, createRandomMeteor(1, true)]),
    ) as Record<MeteorName, MeteorConfig>);
  }, []);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
    const syncInputMode = () => {
      setTouchMode(coarsePointer.matches);
      setActive(coarsePointer.matches);
    };
    syncInputMode();
    coarsePointer.addEventListener("change", syncInputMode);
    return () => coarsePointer.removeEventListener("change", syncInputMode);
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(
      () => setAlertIndex(index => (index + 1) % alerts.length),
      1500,
    );
    return () => window.clearInterval(interval);
  }, [active]);

  const updateTarget = (x: number, y: number) => {
    const game = gameRef.current;
    if (!game) return;

    const bounds = game.getBoundingClientRect();
    x = Math.min(Math.max(x, 18), bounds.width - 18);
    y = Math.min(Math.max(y, 58), bounds.height - 25);

    targetRef.current = { x: x / bounds.width, y: y / bounds.height };

    game.style.setProperty("--target-x", `${x}px`);
    game.style.setProperty("--target-y", `${y}px`);
    game.style.setProperty(
      "--ship-offset-y",
      `${Math.min(Math.max((y - bounds.height * 0.71) * 0.18, -30), 24)}px`,
    );
  };

  const updatePointer = (clientX: number, clientY: number) => {
    const bounds = gameRef.current?.getBoundingClientRect();
    if (bounds) updateTarget(clientX - bounds.left, clientY - bounds.top);
  };

  const schedule = (callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  };

  const regenerateMeteor = (name: MeteorName, stagger = false) => {
    setMeteorConfigs(current => ({
      ...current,
      [name]: createRandomMeteor(current[name].generation + 1, stagger),
    }));
  };

  const fire = (clientX?: number, clientY?: number) => {
    const game = gameRef.current;
    const ship = game?.querySelector<HTMLElement>(".orbit-game__ship");
    if (!game || !ship) return;

    const bounds = game.getBoundingClientRect();
    const shipBounds = ship.getBoundingClientRect();
    const aimedX = clientX === undefined ? targetRef.current.x * bounds.width : clientX - bounds.left;
    const aimedY = clientY === undefined ? targetRef.current.y * bounds.height : clientY - bounds.top;
    const targetX = Math.min(Math.max(aimedX, 0), bounds.width);
    const targetY = Math.min(Math.max(aimedY, 0), bounds.height);

    const hitMeteor = meteorites.find(name => {
      const meteor = meteorRefs.current[name];
      if (!meteor || destroyedRef.current.has(name)) return false;
      if (Number.parseFloat(window.getComputedStyle(meteor).opacity) < 0.2) return false;

      const rect = meteor.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - bounds.left;
      const centerY = rect.top + rect.height / 2 - bounds.top;
      const radius = Math.max(24, rect.width * 0.75);
      return Math.hypot(targetX - centerX, targetY - centerY) <= radius;
    });

    const meteorBounds = hitMeteor && meteorRefs.current[hitMeteor]?.getBoundingClientRect();
    if (hitMeteor) destroyedRef.current.add(hitMeteor);
    const toX = meteorBounds ? meteorBounds.left + meteorBounds.width / 2 - bounds.left : targetX;
    const toY = meteorBounds ? meteorBounds.top + meteorBounds.height / 2 - bounds.top : targetY;
    const id = nextShotId.current++;

    setShots(current => [...current, {
      id,
      fromX: (shipBounds.right - bounds.left - 5) / bounds.width * 100,
      fromY: (shipBounds.top + shipBounds.height / 2 - bounds.top) / bounds.height * 100,
      toX: toX / bounds.width * 100,
      toY: toY / bounds.height * 100,
      hit: Boolean(hitMeteor),
      impact: false,
    }]);

    schedule(() => {
      setShots(current => current.map(shot => shot.id === id ? { ...shot, impact: true } : shot));
      if (hitMeteor) {
        setDestroyed(current => [...current, hitMeteor]);
        setIntercepts(value => value + 1);
        setAlertIndex(meteorConfigs[hitMeteor].alert);

        schedule(() => {
          regenerateMeteor(hitMeteor);
          destroyedRef.current.delete(hitMeteor);
          setDestroyed(current => current.filter(name => name !== hitMeteor));
        }, 1500);
      }
    }, 180);

    schedule(() => setShots(current => current.filter(shot => shot.id !== id)), 600);
  };

  return (
    <section className="orbit-feature" aria-labelledby="orbit-feature-title">
      <div className={`orbit-terminal ${active ? "is-active" : ""}`}>
        <div className="hero-terminal__bar">
          <span><i /><i /><i /></span>
          <span>~/defense/orbit.exe</span>
          <span>×</span>
        </div>

        <div
          ref={gameRef}
          className="orbit-game"
          role="button"
          tabIndex={0}
          aria-label={`Defensa orbital interactiva. ${touchMode ? "Toca un meteorito para disparar." : "Apunta con el ratón y haz clic para disparar."} Con teclado, usa las flechas y pulsa Intro. ${intercepts} interceptados.`}
          onPointerEnter={event => {
            if (event.pointerType === "mouse") setActive(true);
          }}
          onPointerLeave={event => {
            if (event.pointerType === "mouse") setActive(false);
          }}
          onPointerDown={event => {
            updatePointer(event.clientX, event.clientY);
            pointerStartRef.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
            if (event.pointerType !== "mouse") {
              setTouchMode(true);
              setActive(true);
            }
          }}
          onPointerMove={event => {
            if (event.pointerType === "mouse" || pointerStartRef.current?.id === event.pointerId) {
              updatePointer(event.clientX, event.clientY);
            }
          }}
          onPointerUp={event => {
            const start = pointerStartRef.current;
            pointerStartRef.current = null;
            if (!start || start.id !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
            if (event.pointerType === "mouse" || moved <= 12) {
              updatePointer(event.clientX, event.clientY);
              fire(event.clientX, event.clientY);
            }
          }}
          onPointerCancel={() => { pointerStartRef.current = null; }}
          onFocus={() => setActive(true)}
          onBlur={() => {
            if (!touchMode) setActive(false);
          }}
          onKeyDown={event => {
            const movement: Record<string, [number, number]> = {
              ArrowUp: [0, -20],
              ArrowDown: [0, 20],
              ArrowLeft: [-20, 0],
              ArrowRight: [20, 0],
            };
            const step = movement[event.key];
            if (step && gameRef.current) {
              event.preventDefault();
              const bounds = gameRef.current.getBoundingClientRect();
              updateTarget(
                targetRef.current.x * bounds.width + step[0],
                targetRef.current.y * bounds.height + step[1],
              );
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fire();
            }
          }}
        >
          <div className="orbit-game__hud">
            <span>SCORE <b>{String(intercepts * 250).padStart(6, "0")}</b></span>
            <span>{active ? "MODO MANUAL" : "MODO DEMO"}</span>
            <span>SHIELD <b>███░</b></span>
          </div>

          <div className="orbit-game__incident" aria-live="polite">
            <span>[!] INCIDENTE #{String(alertIndex + 1).padStart(2, "0")}</span>
            <strong>{alerts[alertIndex]}</strong>
            <small>{active
              ? touchMode ? "TOCA UN METEORITO / DISPARAR" : "APUNTA AL METEORITO / CLIC PARA DISPARAR"
              : touchMode ? "TOCA EL RADAR PARA ACTIVAR DEFENSA" : "PASA EL CURSOR PARA ACTIVAR DEFENSA"}
            </small>
          </div>

          <div className="orbit-game__stars" aria-hidden="true" />
          <div className="orbit-game__planet" aria-hidden="true"><span className="orbit-game__ring" /></div>
          <div className="orbit-game__ship" aria-hidden="true"><span className="orbit-game__thruster" /></div>

          {meteorites.map(meteorite => {
            const config = meteorConfigs[meteorite];
            const style: MeteorStyle = {
              "--start-x": `${config.startX}%`,
              "--start-y": `${config.startY}%`,
              "--end-x": `${config.endX}%`,
              "--end-y": `${config.endY}%`,
              "--meteor-spin": `${config.spin}deg`,
              width: `${config.size}px`,
              animationDuration: `${config.duration}s`,
              animationDelay: `${config.delay}s`,
            };

            return (
              <span
                key={`${meteorite}-${config.generation}`}
                ref={element => { meteorRefs.current[meteorite] = element; }}
                className={`orbit-game__meteor orbit-game__meteor--${meteorite} ${destroyed.includes(meteorite) ? "is-destroyed" : ""}`}
                style={style}
                aria-hidden="true"
                data-threat={alerts[config.alert]}
                onAnimationIteration={() => {
                  if (!destroyedRef.current.has(meteorite)) regenerateMeteor(meteorite);
                }}
              >
                <i /><i /><i />
              </span>
            );
          })}

          <svg className="orbit-game__lasers" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {meteorites.map(meteorite => {
              const config = meteorConfigs[meteorite];
              return <line
                key={`${meteorite}-${config.generation}`}
                className={`orbit-game__laser orbit-game__laser--${meteorite}`}
                x1="21"
                y1="71"
                x2={config.endX}
                y2={config.endY}
                pathLength="100"
                style={{ animationDuration: `${config.duration}s`, animationDelay: `${config.delay}s` }}
              />;
            })}
          </svg>

          {meteorites.map(meteorite => {
            const config = meteorConfigs[meteorite];
            return <span
              key={`${meteorite}-${config.generation}`}
              className={`orbit-game__blast orbit-game__blast--${meteorite}`}
              style={{
                left: `${config.endX}%`,
                top: `${config.endY}%`,
                animationDuration: `${config.duration}s`,
                animationDelay: `${config.delay}s`,
              }}
              aria-hidden="true"
            ><i /><i /><i /><i /></span>;
          })}

          <svg className="orbit-game__manual-shots" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {shots.filter(shot => !shot.impact).map(shot => (
              <line key={shot.id} x1={shot.fromX} y1={shot.fromY} x2={shot.toX} y2={shot.toY} pathLength="100" />
            ))}
          </svg>
          {shots.filter(shot => shot.impact).map(shot => (
            <span
              key={shot.id}
              className={`orbit-game__manual-impact ${shot.hit ? "orbit-game__manual-impact--hit" : ""}`}
              style={{ left: `${shot.toX}%`, top: `${shot.toY}%` }}
              aria-hidden="true"
            >*</span>
          ))}

          {active && <span key={intercepts} className="orbit-game__target" aria-hidden="true"><i /><i /></span>}

          <div className="orbit-game__message"><span>ALERTA / MALAS DECISIONES ENTRANTES</span><b>DEFENSA DE PRODUCCIÓN ACTIVA_</b></div>
          <div className="orbit-game__scanline" aria-hidden="true" />
        </div>
      </div>

      <div className="orbit-feature__copy">
        <p className="eyebrow">// IDEAS EN CONSTRUCCIÓN</p>
        <h2 id="orbit-feature-title">Todo sistema<br />merece una <em>segunda vida.</em><span className="heading-star">*</span></h2>
        <p>Construir, romper y volver a intentarlo. Cada proyecto deja aprendizajes que vale la pena documentar y compartir.</p>
        <div className="orbit-feature__status"><span><i /> ARCHIVO ACTIVO</span><span>IDEAS / PROCESO / CÓDIGO</span></div>
      </div>
    </section>
  );
}
