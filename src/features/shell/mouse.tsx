/**
 * Das NinAI-Maskottchen: eine kleine Maus (gleiche Form wie das App-Icon).
 * mood: happy = Standard · sleepy = arbeitet/lädt · party = geschafft
 */
export function Mouse({
  mood = "happy",
  className = "size-16",
}: {
  mood?: "happy" | "sleepy" | "party";
  className?: string;
}) {
  const eyes =
    mood === "happy" ? (
      <>
        <ellipse cx="204" cy="298" rx="19" ry="24" fill="#2b1d2a" />
        <ellipse cx="308" cy="298" rx="19" ry="24" fill="#2b1d2a" />
        <circle cx="211" cy="288" r="7" fill="#fff" />
        <circle cx="315" cy="288" r="7" fill="#fff" />
      </>
    ) : (
      <path
        d={
          mood === "sleepy"
            ? "M186 300q18 14 36 0M290 300q18 14 36 0" // geschlossen, entspannt
            : "M186 306q18-22 36 0M290 306q18-22 36 0" // ^ ^ fröhlich
        }
        fill="none"
        stroke="#2b1d2a"
        strokeWidth="9"
        strokeLinecap="round"
      />
    );

  return (
    <svg viewBox="56 84 400 352" className={className} aria-hidden>
      {mood === "party" && (
        <g>
          <circle cx="86" cy="120" r="10" fill="#ff7aa8" />
          <rect x="420" y="110" width="18" height="18" rx="4" fill="#8f7cf0" transform="rotate(20 429 119)" />
          <circle cx="440" cy="250" r="8" fill="#4cc38a" />
          <rect x="66" y="250" width="16" height="16" rx="4" fill="#ffc24b" transform="rotate(-15 74 258)" />
        </g>
      )}
      <circle cx="150" cy="178" r="84" fill="#fff" stroke="#f3dfe8" strokeWidth="4" />
      <circle cx="362" cy="178" r="84" fill="#fff" stroke="#f3dfe8" strokeWidth="4" />
      <circle cx="154" cy="182" r="54" fill="#ffb8d0" />
      <circle cx="358" cy="182" r="54" fill="#ffb8d0" />
      <path
        d="M256 168c92 0 156 62 156 140 0 70-66 116-156 116s-156-46-156-116c0-78 64-140 156-140z"
        fill="#fff"
        stroke="#f3dfe8"
        strokeWidth="4"
      />
      {eyes}
      <ellipse cx="166" cy="342" rx="24" ry="14" fill="#ff8fb6" opacity=".55" />
      <ellipse cx="346" cy="342" rx="24" ry="14" fill="#ff8fb6" opacity=".55" />
      <ellipse cx="256" cy="336" rx="17" ry="12" fill="#f0679b" />
      <path
        d={mood === "party" ? "M232 356q24 30 48 0z" : "M256 348v8m-16 0c4 10 16 10 16 0 0 10 12 10 16 0"}
        fill={mood === "party" ? "#c2185b" : "none"}
        stroke="#2b1d2a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#d9c6d2" strokeWidth="5" strokeLinecap="round">
        <path d="M214 344l-74-10M214 356l-70 12M298 344l74-10M298 356l70 12" />
      </g>
    </svg>
  );
}
