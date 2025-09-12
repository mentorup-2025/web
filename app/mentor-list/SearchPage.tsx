import { Layout } from "antd";
import { Mentor, SearchFiltersType } from "../../types";
import ClientSearchPage from "./ClientSearchPage";

const { Content } = Layout;

export default async function SearchPage() {
  // Server-side data fetching - use absolute URL for server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const res = await fetch(`${baseUrl}/api/mentor/list`, {
    cache: 'no-store',
    next: { tags: ['mentorlist'] },
    headers: {
      'Content-Type': 'application/json',
    }
  });
  const data = await res.json();
  const mentors: Mentor[] = data.data || [];

  // Add timestamp to validate if page is cached
  const timestamp = new Date().toISOString();

  return (
    <div>
      {/* Debug info - remove in production */}
      <ClientSearchPage initialMentors={mentors} />
    </div>
  );
}
