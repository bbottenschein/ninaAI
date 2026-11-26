import { MOTIFS, motifClass, type Motif } from "./motif";

export type Mood = "happy" | "sleepy" | "party";

/**
 * Das NinAI-Maskottchen, je nach Design (SPEC-settings › Design):
 * Flower = Maus (wie das App-Icon) · Clean Light = Origami-Kranich · Dark = Eule · Cozy Cat = Katze.
 * mood: happy = Standard · sleepy = arbeitet/lädt · party = geschafft
 */
export function Mascot({ mood = "happy", className = "size-16" }: { mood?: Mood; className?: string }) {
  return (
    <>
      {MOTIFS.map((m) => (
        <MascotArt key={m} motif={m} mood={mood} className={`${className} ${motifClass(m)}`} />
      ))}
    </>
  );
}

function MascotArt({ motif, mood, className }: { motif: Motif; mood: Mood; className: string }) {
  if (motif === "clean") return <Crane mood={mood} className={className} />;
  if (motif === "dark") return <Owl mood={mood} className={className} />;
  if (motif === "cat") return <Cat mood={mood} className={className} />;
  return <Mouse mood={mood} className={className} />;
}

/** Konfetti für „party“, in allen Varianten gleich platziert (viewBox 0 0 400 352). */
function Confetti({ colors }: { colors: [string, string, string, string] }) {
  return (
    <g>
      <circle cx="30" cy="36" r="10" fill={colors[0]} />
      <rect x="364" y="26" width="18" height="18" rx="4" fill={colors[1]} transform="rotate(20 373 35)" />
      <circle cx="384" cy="166" r="8" fill={colors[2]} />
      <rect x="10" y="166" width="16" height="16" rx="4" fill={colors[3]} transform="rotate(-15 18 174)" />
    </g>
  );
}

/** Augen in drei Stimmungen: offen, geschlossen (schläfrig), ^ ^ (fröhlich). */
function Eyes({ mood, left, right, ink, r = 19 }: { mood: Mood; left: [number, number]; right: [number, number]; ink: string; r?: number }) {
  if (mood === "happy") {
    return (
      <>
        {[left, right].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 1.25} fill={ink} />
            <circle cx={x + r * 0.35} cy={y - r * 0.5} r={r * 0.37} fill="#fff" />
          </g>
        ))}
      </>
    );
  }
  const d = (x: number, y: number) =>
    mood === "sleepy" ? `M${x - 18} ${y}q18 14 36 0` : `M${x - 18} ${y + 6}q18-22 36 0`;
  return <path d={`${d(...left)}${d(...right)}`} fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" />;
}

function Cat({ mood, className }: { mood: Mood; className: string }) {
  const fur = "#d9955f";
  const ink = "#3b2a20";
  return (
    <svg viewBox="0 0 400 352" className={className} aria-hidden>
      {mood === "party" && <Confetti colors={["#d9895a", "#8b5a3c", "#5a6b34", "#e9cba8"]} />}
      <path d="M88 180 L98 52 L178 122Z M312 180 L302 52 L222 122Z" fill={fur} stroke="#b06f3c" strokeWidth="4" strokeLinejoin="round" />
      <path d="M110 152 L114 86 L160 124Z M290 152 L286 86 L240 124Z" fill="#f6c9a8" />
      <path
        d="M66 232 C66 150 122 108 200 108 C278 108 334 150 334 232 C334 302 276 338 200 338 C124 338 66 302 66 232Z"
        fill={fur}
        stroke="#b06f3c"
        strokeWidth="4"
      />
      <path d="M200 114v44M174 120l6 32M226 120l-6 32M70 214h32M74 240h28M330 214h-32M326 240h-28" stroke="#b06f3c" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="200" cy="278" rx="66" ry="46" fill="#fbe9d6" />
      <Eyes mood={mood} left={[148, 226]} right={[252, 226]} ink={ink} />
      <ellipse cx="116" cy="266" rx="22" ry="12" fill="#e8a08d" opacity=".55" />
      <ellipse cx="284" cy="266" rx="22" ry="12" fill="#e8a08d" opacity=".55" />
      <path d="M186 256h28l-14 15z" fill="#d9776b" />
      <path
        d={mood === "party" ? "M178 282q22 28 44 0z" : "M200 271v6m-18 2c4 10 18 10 18 0 0 10 14 10 18 0"}
        fill={mood === "party" ? "#b0524a" : "none"}
        stroke={ink}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#a88a72" strokeWidth="5" strokeLinecap="round">
        <path d="M150 276l-80-8M150 290l-76 14M250 276l80-8M250 290l76 14" />
      </g>
    </svg>
  );
}

function Owl({ mood, className }: { mood: Mood; className: string }) {
  const ink = "#141216";
  return (
    <svg viewBox="0 0 400 352" className={className} aria-hidden>
      {mood === "party" && (
        <g fill="#ffc867">
          <path d="M34 30l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" />
          <path d="M370 22l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" fill="#ff8fb3" />
          <path d="M380 160l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
          <path d="M20 170l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#ff8fb3" />
        </g>
      )}
      <path
        d="M96 150 L112 54 L170 112 Q200 102 230 112 L288 54 L304 150 Q342 228 314 288 Q284 342 200 342 Q116 342 86 288 Q58 228 96 150Z"
        fill="#5a4a63"
      />
      <path d="M92 206 Q60 250 86 300 Q104 262 112 226Z M308 206 Q340 250 314 300 Q296 262 288 226Z" fill="#4a3c52" />
      <ellipse cx="200" cy="282" rx="78" ry="56" fill="#7d6a88" />
      <path d="M168 270q10 10 20 0M212 270q10 10 20 0M190 296q10 10 20 0M156 300q8 8 16 0M228 300q8 8 16 0" stroke="#5a4a63" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="148" cy="190" r="48" fill="#f2eef3" />
      <circle cx="252" cy="190" r="48" fill="#f2eef3" />
      {mood === "happy" ? (
        <>
          <circle cx="152" cy="194" r="22" fill={ink} />
          <circle cx="248" cy="194" r="22" fill={ink} />
          <circle cx="160" cy="184" r="8" fill="#fff" />
          <circle cx="256" cy="184" r="8" fill="#fff" />
        </>
      ) : (
        <Eyes mood={mood} left={[150, 192]} right={[250, 192]} ink={ink} />
      )}
      <path d="M184 222h32l-16 26z" fill="#ffc867" />
      <ellipse cx="104" cy="238" rx="20" ry="11" fill="#ff8fb3" opacity=".45" />
      <ellipse cx="296" cy="238" rx="20" ry="11" fill="#ff8fb3" opacity=".45" />
    </svg>
  );
}

function Crane({ mood, className }: { mood: Mood; className: string }) {
  const ink = "#3f3a35";
  // Flügel oben beim Feiern, sonst ausgebreitet.
  const body =
    mood === "party"
      ? "M40 236 L170 196 L196 40 L222 196 L360 60 L248 236 L200 300 L152 236Z"
      : "M40 236 L170 190 L200 96 L230 190 L364 130 L250 236 L200 300 L150 236Z";
  return (
    <svg viewBox="0 0 400 352" className={className} aria-hidden>
      {mood === "party" && <Confetti colors={["#c4b8a8", "#3f3a35", "#8fa088", "#ddd5ca"]} />}
      <ellipse cx="200" cy="330" rx="120" ry="10" fill="#3f3a35" opacity=".08" />
      <path d={body} fill="#fff" stroke={ink} strokeWidth="8" strokeLinejoin="round" />
      <path d={mood === "party" ? "M196 40 L200 300M170 196 L152 236M222 196 L248 236" : "M200 96 L200 300M170 190 L150 236M230 190 L250 236"} stroke="#c9c0b3" strokeWidth="5" fill="none" />
      <path d="M40 236 L22 196 L58 222" fill="#fff" stroke={ink} strokeWidth="8" strokeLinejoin="round" />
      {mood === "sleepy" ? (
        <>
          <path d="M28 214q6 5 12 0" stroke={ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          <text x="300" y="96" fontSize="44" fontWeight="800" fill="#9a8f83">z</text>
          <text x="336" y="64" fontSize="32" fontWeight="800" fill="#c4b8a8">z</text>
        </>
      ) : (
        <circle cx="32" cy="212" r="6" fill={ink} />
      )}
    </svg>
  );
}

function Mouse({ mood, className }: { mood: Mood; className: string }) {
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
