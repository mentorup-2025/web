"use client";

import { Layout } from "antd";
import styles from "./search.module.css";
import Navbar from "../components/Navbar";
import SearchFilters from "./components/SearchFilters";
import MentorGrid from "./components/MentorGrid";
import { useState, useEffect } from "react";
import { Mentor, SearchFiltersType } from "../../types";

const { Content } = Layout;

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch("/api/mentor/list", {
          next: { tags: ["mentorlist"] },
        });
        const data = await response.json();
        if (data.code === 200) {
          setMentors(data.data);
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  };

  // Extract unique job titles and industries from mentor data
  const uniqueJobTitles = Array.from(
    new Set(mentors.map((mentor) => mentor.mentor.title))
  );
  const uniqueIndustries = Array.from(
    new Set(mentors.flatMap((mentor) => mentor.industries))
  );

  // Extract unique service types from mentor data
  const uniqueServiceTypes = Array.from(
    new Set(
      mentors.flatMap((mentor) =>
        Object.entries(mentor.mentor.services).map(([key, value]) =>
          typeof value === "object" ? value.type : key
        )
      )
    )
  );

  // Calculate price range from mentor services
  const allPrices = mentors.flatMap((mentor) =>
    Object.values(mentor.mentor.services).map((service) =>
      typeof service === "number" ? service : service.price
    )
  );

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 200;

  return (
    <Layout className={styles.layout}>
      <Navbar />
      <Layout className={styles.mainLayout}>
        <SearchFilters
          onFiltersChange={handleFiltersChange}
          jobTitles={uniqueJobTitles}
          industries={uniqueIndustries}
          serviceTypes={uniqueServiceTypes}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
        <Content className={styles.content}>
          <MentorGrid filters={filters} mentors={mentors} loading={loading} />
        </Content>
      </Layout>
    </Layout>
  );
}
