"use client";

import { Layout } from "antd";
import styles from "./search.module.css";
import Navbar from "../components/Navbar";
import SearchFilters from "./components/SearchFilters";
import MentorGrid from "./components/MentorGrid";
import { useState, useMemo } from "react";
import { Mentor, SearchFiltersType } from "../../types";
import TopFilters from "./components/TopFilters";

const { Content } = Layout;

interface ClientSearchPageProps {
    initialMentors: Mentor[];
}

export default function ClientSearchPage({ initialMentors }: ClientSearchPageProps) {
    const [filters, setFilters] = useState<SearchFiltersType>({});
    const [mentors] = useState<Mentor[]>(initialMentors);
    const [loading] = useState(false);

    const handleFiltersChange = (newFilters: SearchFiltersType) => {
        // 基于传入的合并结果做清洗
        const cleaned: SearchFiltersType = { ...newFilters };

        const has = (obj: any, k: keyof SearchFiltersType) =>
            Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined;

        const hasPrice =
            has(newFilters, 'minPrice') || has(newFilters, 'maxPrice');
        const hasYoe =
            has(newFilters, 'minExperience') || has(newFilters, 'maxExperience');

        // 哪一组是“这次点击真正改变的”
        const priceChanged =
            newFilters.minPrice !== filters.minPrice ||
            newFilters.maxPrice !== filters.maxPrice;

        const yoeChanged =
            newFilters.minExperience !== filters.minExperience ||
            newFilters.maxExperience !== filters.maxExperience;

        if (hasPrice && hasYoe) {
            // 同时存在时，优先保留“变化的那一组”
            if (yoeChanged && !priceChanged) {
                delete cleaned.minPrice;
                delete cleaned.maxPrice;
            } else if (priceChanged && !yoeChanged) {
                delete cleaned.minExperience;
                delete cleaned.maxExperience;
            } else {
                // 都变 or 都没变：默认优先 YOE（也可按你需求改成优先 Price）
                delete cleaned.minPrice;
                delete cleaned.maxPrice;
            }
        } else if (hasPrice) {
            delete cleaned.minExperience;
            delete cleaned.maxExperience;
        } else if (hasYoe) {
            delete cleaned.minPrice;
            delete cleaned.maxPrice;
        }

        setFilters(cleaned);
    };


    // TopFilters 的互斥 patch
    const handleTopFiltersPatch = (patch: Partial<SearchFiltersType>) => {
        handleFiltersChange({ ...filters, ...patch });
    };

    // 供 TopFilters 计算范围（动态根据数据）
    const allYoes = useMemo(() => mentors.map(m => Number(m.mentor.years_of_experience ?? 0)), [mentors]);
    const minYoe = allYoes.length ? Math.min(...allYoes) : 0;
    const maxYoe = allYoes.length ? Math.max(...allYoes) : 20;

    const allPrices = useMemo(
        () =>
            mentors.flatMap(m =>
                Object.values(m.mentor.services ?? {}).map(s =>
                    typeof s === "number" ? Number(s) : Number((s as any)?.price)
                )
            ).filter(v => Number.isFinite(v)),
        [mentors]
    );
    const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length ? Math.max(...allPrices) : 200;

    // 侧边栏枚举
    const uniqueJobTitles = useMemo(
        () => Array.from(new Set(mentors.map(m => m.mentor.title).filter(Boolean))),
        [mentors]
    );
    const uniqueIndustries = useMemo(
        () => Array.from(new Set(mentors.flatMap(m => m.industries).filter(Boolean))),
        [mentors]
    );
    const uniqueServiceTypes = useMemo(
        () =>
            Array.from(
                new Set(
                    mentors.flatMap(m =>
                        Object.entries(m.mentor.services ?? {}).map(([k, v]) =>
                            typeof v === "object" && v && "type" in v ? (v as any).type : k
                        )
                    )
                )
            ),
        [mentors]
    );
    const uniqueCompanies = useMemo(
        () => Array.from(new Set(mentors.map(m => m.mentor.company).filter(Boolean))),
        [mentors]
    );

    return (
        <Layout className={styles.layout}>
            <Navbar />
            <Layout className={styles.mainLayout}>
                <SearchFilters
                    value={filters}
                    onFiltersChange={handleFiltersChange}
                    jobTitles={uniqueJobTitles}
                    industries={uniqueIndustries}
                    serviceTypes={uniqueServiceTypes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    uniqueCompanies={uniqueCompanies}
                    minYoe={minYoe}
                    maxYoe={maxYoe}
                />

                <Content className={styles.content}>
                    <TopFilters
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        minYoe={minYoe}
                        maxYoe={maxYoe}
                        onChange={handleTopFiltersPatch}
                        currentFilters={filters} // 新增：传递当前 filters
                    />

                    <MentorGrid filters={filters} mentors={mentors} loading={loading} />
                </Content>
            </Layout>
        </Layout>
    );
}