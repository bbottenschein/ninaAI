import { describe, expect, it } from "vitest";
import { extractArticleText } from "./article";

const long = (s: string) => `${s} ${"Lorem ipsum dolor sit amet. ".repeat(2)}`.trim();

describe("extractArticleText", () => {
  it("nimmt nur Absätze aus <article> und lässt kurze Schnipsel weg", () => {
    const html = `<html><body>
      <p>${long("Navigation außerhalb")}</p>
      <article>
        <p class="x">${long("Erster Absatz mit <a href='#'>Link</a>.")}</p>
        <p>Foto: dpa</p>
        <p>${long("Zweiter Absatz &amp; mehr.")}</p>
        <p>${long("Zweiter Absatz &amp; mehr.")}</p>
      </article></body></html>`;
    const text = extractArticleText(html);
    expect(text.split("\n\n")).toEqual([
      long("Erster Absatz mit Link ."),
      long("Zweiter Absatz & mehr."),
    ]);
    expect(text).not.toContain("Navigation");
  });

  it("nutzt die ganze Seite, wenn es kein <article> gibt", () => {
    expect(extractArticleText(`<div><p>${long("Absatz")}</p></div>`)).toBe(long("Absatz"));
  });

  it("liefert leeren Text bei Sperrseiten ohne Absätze", () => {
    expect(extractArticleText("<html><title>Access denied</title></html>")).toBe("");
  });
});
