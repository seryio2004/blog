import styles from "./forgejo-post-background.module.css";

const worlds = [
  {
    position: styles.worldOne,
    surface: styles.gasWorld,
    ringed: true,
    moon: false,
  },
  {
    position: styles.worldTwo,
    surface: styles.crystalWorld,
    ringed: false,
    moon: true,
  },
  {
    position: styles.worldThree,
    surface: styles.acidWorld,
    ringed: false,
    moon: false,
  },
  {
    position: styles.worldFour,
    surface: styles.forestWorld,
    ringed: true,
    moon: true,
  },
  {
    position: styles.worldFive,
    surface: styles.nightWorld,
    ringed: false,
    moon: true,
  },
  {
    position: styles.worldSix,
    surface: styles.mossWorld,
    ringed: false,
    moon: false,
  },
] as const;

export function ForgejoPostBackground() {
  return (
    <div className={styles.void} aria-hidden="true">
      {worlds.map(({ position, surface, ringed, moon }) => (
        <span key={position} className={`${styles.world} ${position} ${surface}`}>
          {ringed && (
            <>
              <span className={styles.ringBack} />
              <span className={styles.ringFront} />
            </>
          )}
          <span className={styles.atmosphere}>
            <span className={styles.surface} />
          </span>
          {moon && <span className={styles.moon} />}
        </span>
      ))}
      <span className={styles.comet} />
    </div>
  );
}
