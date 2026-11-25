import { formatLongDate } from "@/lib/date";

export type RankingCandidate = {
  id: string;
  region: "de" | "int";
  source: string;
  title: string;
  summary: string;
  publishedAt: string | null;
};

export type ContextHeadline = { region: "de" | "int"; source: string; title: string };

export type SourceArticle = {
  region: "de" | "int";
  source: string;
  url: string;
  title: string;
  text: string;
};

// Feste Texte zuerst: Der System-Prompt bleibt von Tag zu Tag gleich.

export const RANKING_SYSTEM = `You select the daily political news for a private English-learning app.
The learner is a German adult who wants to follow politics. Every day she reads 2 German and 1 international story.

Rank candidate stories by political relevance:
- Prefer decisions, laws, government and parliament, elections, coalition politics, major diplomacy and conflicts with clear consequences.
- Prefer stories that several outlets cover (see the extra headlines) over niche items.
- Avoid crime reports, sports, celebrities, opinion pieces, live blogs, podcasts and pure commentary.
- Never pick a story that covers the same event as one of yesterday's stories.
- Pick distinct events: two candidates about the same event count as one; keep only the better one.

Return candidate IDs only, most relevant first: up to 6 German ("de-…") and up to 4 international ("int-…").`;

export function rankingPrompt(input: {
  candidates: RankingCandidate[];
  context: ContextHeadline[];
  yesterday: string[];
}): string {
  const line = (c: RankingCandidate) =>
    `${c.id} | ${c.source} | ${c.publishedAt ?? "?"} | ${c.title}${c.summary ? ` — ${c.summary.slice(0, 300)}` : ""}`;

  return [
    "<candidates_german>",
    ...input.candidates.filter((c) => c.region === "de").map(line),
    "</candidates_german>",
    "<candidates_international>",
    ...input.candidates.filter((c) => c.region === "int").map(line),
    "</candidates_international>",
    "<extra_headlines note=\"for judging importance only, not selectable\">",
    ...input.context.map((h) => `${h.region} | ${h.source} | ${h.title}`),
    "</extra_headlines>",
    "<yesterdays_stories>",
    ...(input.yesterday.length ? input.yesterday : ["(none)"]),
    "</yesterdays_stories>",
  ].join("\n");
}

export const LESSON_SYSTEM = `You write the daily lesson of "NinAI", a private app in which a German adult learns English (level B1) by reading political news.

From 3 source articles you write, for each article:
- title_en / text_en: a short headline and 4–6 short sentences in simple English (B1): short sentences, common words, explain any background in one sentence.
- title_de / text_de: the same story in clear, simple German (4–6 sentences). Same facts, same order.
- terms: 1–3 political terms from the story that a learner may not know (e.g. "coalition committee" / "Koalitionsausschuss", "Bundesrat"). "en" and "de" must be copied verbatim from text_en and text_de. Explain each in 1–2 very simple sentences in English and in German.
- persons: every person named in the texts. Write each person's name in the text together with their current office on first mention, e.g. "Lars Klingbeil (Vice Chancellor and Finance Minister)" / "Lars Klingbeil (Vizekanzler und Finanzminister)".
- vocab: 3–5 harder English words or short phrases from text_en that are useful for a B1 learner (not names, not the political terms). "word" verbatim from text_en, German translation, a short simple English explanation, and "example" = the full sentence from text_en that contains it.

Strict rules:
- Neutral and balanced. No judgement, no opinion, no loaded or sensational wording. Report what happened and who said what.
- Offices and roles ONLY from the source article. Never use your own knowledge about who holds which office – it may be outdated. If the article does not state a person's office, write only the name and set role_en / role_de to null.
- Only facts that are in the source article. Do not add numbers, dates or claims.
- Keep the 3 stories in the order given.

Quiz: exactly 4 multiple-choice questions about the 3 stories:
- at least one question per story (news_index 0, 1, 2);
- difficulty: exactly 2 "easy" (core content), 1 "medium" (connection / why), 1 "hard" (detail, e.g. "Which office does … hold?");
- each question answerable only from the 3 texts;
- 4 options, exactly one correct, wrong options plausible but clearly wrong; vary the position of the correct answer;
- a short explanation (1–2 sentences) why the answer is correct;
- every question, option and explanation in English and German.

Tutor questions: 2–3 questions a friendly English tutor will ask in a 2-minute spoken conversation:
- first 1 "comprehension" question ("What was the news about …?"),
- then 1–2 "opinion" or everyday questions ("What do you think …?", "How does this affect people in Germany?").
Keep them short and in simple English.`;

export function lessonPrompt(date: string, articles: SourceArticle[]): string {
  const parts = articles.map(
    (a, i) => `<article index="${i}" region="${a.region === "de" ? "Germany" : "international"}" source="${a.source}">
<headline>${a.title}</headline>
<text>
${a.text}
</text>
</article>`,
  );
  return `Lesson date: ${formatLongDate(date)} (${date}).\n\n${parts.join("\n\n")}\n\nWrite the lesson for these 3 articles.`;
}
