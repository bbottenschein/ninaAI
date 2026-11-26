import { describe, expect, it } from "vitest";
import { sniffAudioExtension } from "./audio-format";

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("sniffAudioExtension", () => {
  it("erkennt mp4 vom iPhone auch ohne MIME-Typ", () => {
    expect(sniffAudioExtension(bytes([0, 0, 0, 28], "ftypM4A ", [0, 0]), "")).toBe("mp4");
  });
  it("erkennt webm, ogg und wav", () => {
    expect(sniffAudioExtension(bytes([0x1a, 0x45, 0xdf, 0xa3, 1, 2]))).toBe("webm");
    expect(sniffAudioExtension(bytes("OggS", [0, 2]))).toBe("ogg");
    expect(sniffAudioExtension(bytes("RIFF", [0, 0, 0, 0], "WAVE"))).toBe("wav");
  });
  it("fällt auf den MIME-Typ zurück", () => {
    expect(sniffAudioExtension(bytes([1, 2, 3]), "audio/mp4;codecs=mp4a.40.2")).toBe("mp4");
    expect(sniffAudioExtension(bytes([1, 2, 3]), "")).toBe("webm");
  });
});
