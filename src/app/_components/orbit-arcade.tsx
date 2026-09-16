"use client";

import { useEffect, useRef, useState } from "react";

const meteorites = ["one", "two", "three", "four"] as const;
const alerts = [
  "PUSH A MASTER EN VIERNES",
  "DEPLOY SIN TESTS",
  "FORCE PUSH DETECTADO",
  "HOTFIX SIN ROLLBACK",
  "SECRETOS EN EL COMMIT",
  "DEPENDENCIA SIN FIJAR",
] as const;

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
  const [active, setActive] = useState(false);
  const [alertIndex, setAlertIndex] = useState(0);
  const [intercepts, setIntercepts] = useState(0);
  const [destroyed, setDestroyed] = useState<string[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => () => {
    timersRef.current.forEach(window.clearTimeout);
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
        setAlertIndex(meteorites.indexOf(hitMeteor));

        schedule(() => {
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
          aria-label={`Defensa orbital interactiva. Apunta con el ratón y haz clic para disparar. Con teclado, usa las flechas y pulsa Intro. ${intercepts} interceptados.`}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={() => setActive(false)}
          onPointerMove={event => updatePointer(event.clientX, event.clientY)}
          onClick={event => fire(event.clientX, event.clientY)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
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
            <span>⚠ INCIDENTE #{String(alertIndex + 1).padStart(2, "0")}</span>
            <strong>{alerts[alertIndex]}</strong>
            <small>{active ? "APUNTA AL METEORITO · CLIC PARA DISPARAR" : "PASA EL CURSOR PARA ACTIVAR DEFENSA"}</small>
          </div>

          <div className="orbit-game__stars" aria-hidden="true" />
          <div className="orbit-game__planet" aria-hidden="true"><span className="orbit-game__ring" /></div>
          <div className="orbit-game__ship" aria-hidden="true"><span className="orbit-game__thruster" /></div>

          {meteorites.map((meteorite, index) => (
            <span
              key={meteorite}
              ref={element => { meteorRefs.current[meteorite] = element; }}
              className={`orbit-game__meteor orbit-game__meteor--${meteorite} ${destroyed.includes(meteorite) ? "is-destroyed" : ""}`}
              aria-hidden="true"
              data-threat={alerts[index]}
            >
              <i /><i /><i />
            </span>
          ))}

          <svg className="orbit-game__lasers" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line className="orbit-game__laser orbit-game__laser--one" x1="21" y1="71" x2="61" y2="35" pathLength="100" />
            <line className="orbit-game__laser orbit-game__laser--two" x1="21" y1="71" x2="65" y2="57" pathLength="100" />
            <line className="orbit-game__laser orbit-game__laser--three" x1="21" y1="71" x2="49" y2="25" pathLength="100" />
            <line className="orbit-game__laser orbit-game__laser--four" x1="21" y1="71" x2="70" y2="29" pathLength="100" />
          </svg>

          <span className="orbit-game__blast orbit-game__blast--one" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="orbit-game__blast orbit-game__blast--two" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="orbit-game__blast orbit-game__blast--three" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="orbit-game__blast orbit-game__blast--four" aria-hidden="true"><i /><i /><i /><i /></span>

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
            >✳</span>
          ))}

          {active && <span key={intercepts} className="orbit-game__target" aria-hidden="true"><i /><i /></span>}

          <div className="orbit-game__message"><span>ALERTA / MALAS DECISIONES ENTRANTES</span><b>DEFENSA DE PRODUCCIÓN ACTIVA_</b></div>
          <div className="orbit-game__scanline" aria-hidden="true" />
        </div>
      </div>

      <div className="orbit-feature__copy">
        <p className="eyebrow">// IDEAS EN CONSTRUCCIÓN</p>
        <h2 id="orbit-feature-title">Todo sistema<br />merece una <em>segunda vida.</em><span className="heading-star">✳</span></h2>
        <p>Construir, romper y volver a intentarlo. Cada proyecto deja aprendizajes que vale la pena documentar y compartir.</p>
        <div className="orbit-feature__status"><span><i /> ARCHIVO ACTIVO</span><span>IDEAS / PROCESO / CÓDIGO</span></div>
      </div>
    </section>
  );
}
