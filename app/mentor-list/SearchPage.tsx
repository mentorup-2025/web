import { Layout } from "antd";
import { Mentor, SearchFiltersType } from "../../types";
import ClientSearchPage from "./ClientSearchPage";

const { Content } = Layout;

export default async function SearchPage() {
  // Server-side data fetching with no caching to ensure fresh data
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mentor/list`, {
    cache: 'no-store',
    next: { tags: ['mentorlist'] }
  });
  const data = await res.json();
  const mentors: Mentor[] = data.data || [];

  // Add timestamp to validate if page is cached
  const timestamp = new Date().toISOString();
  console.log('Page rendered at:', timestamp);

  return (
    <div>
      {/* Debug info - remove in production */}
      <ClientSearchPage initialMentors={mentors} />
    </div>
  );
}
