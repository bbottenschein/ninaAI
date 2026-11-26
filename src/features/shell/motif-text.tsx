import { MOTIFS, motifClass, type Motif } from "./motif";

/** Text je nach Design, z. B. „Blumenwiese“ / „Sternenhimmel“ / „Pfotenpfad“. */
export function MotifText(props: Record<Motif, string>) {
  return (
    <>
      {MOTIFS.map((m) => (
        <span key={m} className={motifClass(m)}>
          {props[m]}
        </span>
      ))}
    </>
  );
}
