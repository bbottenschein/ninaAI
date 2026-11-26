import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { loadTutor } from "@/features/tutor/queries";
import { TutorChat } from "@/features/tutor/tutor-chat";

export const metadata: Metadata = { title: "Tutor" };

// Feedback am Gesprächsende kann etwas dauern.
export const maxDuration = 60;

export default async function TutorPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const data = await loadTutor(date, user);

  if (!data) redirect("/learn");
  // Schritte nacheinander: erst das Quiz.
  if (user.role === "player" && !data.quizDone) redirect("/quiz");

  return (
    <TutorChat
      date={date}
      name={user.role === "player" ? user.name : "Nina"}
      questions={data.questions}
      initialResult={data.result}
      voiceSecondsUsed={data.voiceSecondsUsed}
      readOnly={user.role !== "player"}
    />
  );
}
