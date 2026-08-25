import styles from "./planet-post-background.module.css";

const planets = [
  { position: styles.planetOne, ringed: false },
  { position: styles.planetTwo, ringed: true },
  { position: styles.planetThree, ringed: false },
  { position: styles.planetFour, ringed: true },
  { position: styles.planetFive, ringed: true },
  { position: styles.planetSix, ringed: false },
  { position: styles.planetSeven, ringed: false },
] as const;

export function PlanetPostBackground() {
  return (
    <div className={styles.space} aria-hidden="true">
      {planets.map(({ position, ringed }) => (
        <span
          key={position}
          className={`${styles.body} ${position} ${ringed ? styles.ringed : ""}`}
        >
          <span className={styles.sphere} />
        </span>
      ))}
    </div>
  );
}
