/**
 * Erkennt das Audioformat an den ersten Bytes. iPhones nehmen mp4 auf, melden aber
 * je nach Version einen leeren oder abweichenden MIME-Typ – die Dateiendung für
 * die Spracherkennung muss trotzdem stimmen.
 */
export function sniffAudioExtension(bytes: Uint8Array, mimeType = ""): string {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp") return "mp4";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "webm";
  if (bytes.length >= 4 && ascii(0, 4) === "OggS") return "ogg";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "wav";
  if (bytes.length >= 3 && (ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return "mp3";

  const type = mimeType.split(";")[0].trim();
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("mpeg")) return "mp3";
  return "webm";
}
