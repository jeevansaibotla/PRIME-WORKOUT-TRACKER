type PrimeLaunchScreenProps = {
  exiting: boolean;
};

export function PrimeLaunchScreen({ exiting }: PrimeLaunchScreenProps) {
  return (
    <div
      className={`prime-launch-screen${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-label="PRIME Command startup"
      aria-hidden={exiting}
      >
        <img
          className="prime-launch-fiber-background"
          src={`${import.meta.env.BASE_URL}prime-splash-background-integrated-user-logo.webp`}
          alt=""
          aria-hidden="true"
        />
      <div className="prime-launch-brand">
        <p className="prime-launch-wordmark">PRIME</p>
        <p className="prime-launch-command">COMMAND</p>
        <span className="prime-launch-divider" aria-hidden="true" />
        <p className="prime-launch-tagline">TRAIN WITH INTENT.</p>
        <p className="prime-launch-tagline prime-launch-tagline-secondary">
          LET THE WORK BECOME VISIBLE.
        </p>
      </div>
      <div className="prime-launch-credit">MADE WITH PASSION BY JEEVAN SAI KUMAR BOTLA</div>
    </div>
  );
}
