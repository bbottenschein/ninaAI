import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { NEWS_LANG_COOKIE, parseNewsLang } from "@/features/news/lang";
import { loadQuiz } from "@/features/quiz/queries";
import { QuizRunner } from "@/features/quiz/quiz-runner";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const [data, cookieStore] = await Promise.all([loadQuiz(date, user), cookies()]);

  // Schritte werden nacheinander freigeschaltet: erst alle News lesen.
  if (!data) redirect("/");
  if (user.role === "player" && !data.newsDone) redirect("/news");

  return (
    <QuizRunner
      date={date}
      quiz={data.quiz}
      newsTitles={data.newsTitles}
      initialAnswers={data.answers}
      initialLang={parseNewsLang(cookieStore.get(NEWS_LANG_COOKIE)?.value)}
      readOnly={user.role !== "player"}
    />
  );
}
