import { Layout } from "antd";
import { Mentor, SearchFiltersType } from "../../types";
import ClientSearchPage from "./ClientSearchPage";

const { Content } = Layout;

export default async function SearchPage() {
  // Server-side data fetching with Vercel Data Cache
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mentor/list`, {
    next: { tags: ['mentorlist'] }
  });
  const data = await res.json();
  const mentors: Mentor[] = data.data || [];

  return <ClientSearchPage initialMentors={mentors} />;
}
