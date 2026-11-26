import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { loadNews } from "@/features/news/queries";
import { NEWS_LANG_COOKIE, parseNewsLang } from "@/features/news/lang";
import { NewsReader } from "@/features/news/news-reader";

export default async function NewsPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const [data, cookieStore] = await Promise.all([loadNews(date, user), cookies()]);

  // Noch keine Lektion: Der Heute-Tab zeigt den Status und stößt die Erzeugung an.
  if (!data) redirect("/learn");

  return (
    <NewsReader
      date={date}
      news={data.news}
      initialRead={data.read}
      initialLang={parseNewsLang(cookieStore.get(NEWS_LANG_COOKIE)?.value)}
      readOnly={user.role !== "player"}
    />
  );
}
