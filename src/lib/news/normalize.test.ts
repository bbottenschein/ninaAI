import { describe, expect, it } from "vitest";
import { decodeEntities, parseFeed, selectRecent, stripHtml, stripSourceSuffix } from "./normalize";

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Test</title>
    <item>
      <title><![CDATA[Bundestag beschließt Haushalt]]></title>
      <description><![CDATA[<img src="x.jpg" /><p>Der Bundestag hat den Haushalt &amp; mehr beschlossen.</p>]]></description>
      <link>https://example.org/a?at_medium=RSS&amp;at_campaign=rss</link>
      <pubDate>Wed, 25 Nov 2026 11:55:47 +0100</pubDate>
    </item>
    <item>
      <title>Ohne Link</title>
    </item>
  </channel>
</rss>`;

describe("parseFeed", () => {
  it("liest RSS mit CDATA, HTML und Entities", () => {
    expect(parseFeed(RSS)).toEqual([
      {
        title: "Bundestag beschließt Haushalt",
        summary: "Der Bundestag hat den Haushalt & mehr beschlossen.",
        url: "https://example.org/a?at_medium=RSS&at_campaign=rss",
        publishedAt: "2026-11-25T10:55:47.000Z",
      },
    ]);
  });

  it("verkraftet einzelne Items und kaputtes XML", () => {
    const single = RSS.replace(/<item>\s*<title>Ohne Link[\s\S]*?<\/item>/, "");
    expect(parseFeed(single)).toHaveLength(1);
    expect(parseFeed("not xml <<<")).toEqual([]);
  });

  it("liest Atom", () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>A</title>
      <link href="https://example.org/x"/><updated>2026-11-25T08:00:00Z</updated>
      <summary>S</summary></entry></feed>`;
    expect(parseFeed(atom)).toEqual([
      { title: "A", summary: "S", url: "https://example.org/x", publishedAt: "2026-11-25T08:00:00.000Z" },
    ]);
  });
});

describe("Text-Helfer", () => {
  it("dekodiert benannte und numerische Entities", () => {
    expect(decodeEntities("Merz&#x27; &bdquo;Plan&ldquo; &#8211; &uuml;")).toBe("Merz' „Plan“ – ü");
  });

  it("entfernt Tags, Skripte und doppelte Leerzeichen", () => {
    expect(stripHtml("<p>Hallo <b>Welt</b></p><script>x()</script>\n <br/>!")).toBe("Hallo Welt !");
  });

  it("entfernt den Quellen-Zusatz von Google News", () => {
    expect(stripSourceSuffix("EU agrees deal - POLITICO Europe")).toBe("EU agrees deal");
    expect(stripSourceSuffix("Kein Zusatz")).toBe("Kein Zusatz");
  });
});

describe("selectRecent", () => {
  const item = (url: string, publishedAt: string | null, title = url) => ({
    title,
    summary: "",
    url,
    publishedAt,
  });

  it("filtert alte Meldungen, Dubletten und Meldungen vom Vortag", () => {
    const items = [
      item("https://a.de/1", "2026-11-25T08:00:00Z"),
      item("https://a.de/old", "2026-11-20T08:00:00Z"),
      item("https://www.a.de/1/?x=1", "2026-11-25T09:00:00Z", "andere Überschrift"),
      item("https://a.de/2", "2026-11-25T10:00:00Z"),
      item("https://a.de/3", null),
      item("https://a.de/yesterday", "2026-11-25T07:00:00Z"),
    ];
    const result = selectRecent(items, {
      since: new Date("2026-11-24T00:00:00Z"),
      exclude: ["https://a.de/yesterday?at_medium=RSS"],
      limit: 10,
    });
    expect(result.map((i) => i.url)).toEqual([
      "https://a.de/2",
      "https://www.a.de/1/?x=1",
      "https://a.de/3",
    ]);
  });

  it("begrenzt die Anzahl", () => {
    const items = [1, 2, 3].map((n) => item(`https://a.de/${n}`, `2026-11-25T0${n}:00:00Z`));
    expect(selectRecent(items, { since: new Date(0), limit: 2 })).toHaveLength(2);
  });
});
