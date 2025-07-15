import { Layout } from "antd";
import styles from "./search.module.css";
import Navbar from "../components/Navbar";
import SearchFilters from "./components/SearchFilters";
import MentorGrid from "./components/MentorGrid";
import { Mentor, SearchFiltersType } from "../../types";
import ClientSearchPage from "./ClientSearchPage";

const { Content } = Layout;

export default async function SearchPage() {
  // Server-side data fetching with Vercel Data Cache
  const res = await fetch("/api/mentor/list", {
    next: { tags: ['mentorlist'] }
  });
  const data = await res.json();
  const mentors: Mentor[] = data.data || [];

  return <ClientSearchPage initialMentors={mentors} />;
}
