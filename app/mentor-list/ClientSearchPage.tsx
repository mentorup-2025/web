"use client";
import { Layout, Button, Drawer, Space } from "antd"; // ⬅️ 新增 Drawer, Button, Space
import { useState, useMemo, useEffect } from "react";  // ⬅️ 新增 useEffect
import styles from "./search.module.css";
import Navbar from "../components/Navbar";
import SearchFilters from "./components/SearchFilters";
import MentorGrid from "./components/MentorGrid";
import { Mentor, SearchFiltersType } from "../../types";
import TopSort from "./components/TopSort";

const { Content } = Layout;

interface ClientSearchPageProps {
    initialMentors: Mentor[];
}

export default function ClientSearchPage({ initialMentors }: ClientSearchPageProps) {
    const [filters, setFilters] = useState<SearchFiltersType>({});
    const [mentors] = useState<Mentor[]>(initialMentors);
    const [loading] = useState(false);

    // ====== 关键：检测是否为移动端 ======
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 480px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener?.("change", update);
        return () => mq.removeEventListener?.("change", update);
    }, []);

    // ====== 关键：控制 Drawer ======
    const [filtersOpen, setFiltersOpen] = useState(false);

    const handleFiltersChange = (newFilters: SearchFiltersType) => {
        setFilters(newFilters);
    };
    const handleTopFiltersPatch = (patch: Partial<SearchFiltersType>) => {
        setFilters({ ...filters, ...patch });
    };

    // 供侧边栏筛选器计算范围
    const allYoes = useMemo(
        () => mentors.map(m => Number(m.mentor.years_of_experience ?? 0)),
        [mentors]
    );
    const minYoe = allYoes.length ? Math.min(...allYoes) : 0;
    const maxYoe = allYoes.length ? Math.max(...allYoes) : 20;

    const allPrices = useMemo(
        () =>
            mentors
                .flatMap(m =>
                    Object.values(m.mentor.services ?? {}).map(s =>
                        typeof s === "number" ? Number(s) : Number((s as any)?.price)
                    )
                )
                .filter(v => Number.isFinite(v)),
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

    // 统计当前已选筛选项个数（可选）
    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (filters.jobTitle) c++;
        if (filters.industries?.length) c += filters.industries.length;
        if (filters.company?.length) c += filters.company.length;
        if (filters.serviceTypes?.length) c += filters.serviceTypes.length;
        if (filters.minPrice != null || filters.maxPrice != null) c++;
        if (filters.minExperience != null || filters.maxExperience != null) c++;
        return c;
    }, [filters]);

    return (
        <Layout className={styles.layout}>
            <Navbar />
            <Layout className={styles.mainLayout}>
                {/* 桌面端：保留左侧 Sider */}
                {!isMobile && (
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
                )}

                <Content className={styles.content}>
                    {/* 顶部操作区：移动端显示 Filters 按钮 + 排序 */}
                    <div className={styles.topActions}>
                        {isMobile && (
                            <Button className={styles.filtersButtonMobile} onClick={() => setFiltersOpen(true)}>
                                Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                            </Button>
                        )}
                        <TopSort onChange={handleTopFiltersPatch} currentFilters={filters} />
                    </div>

                    <MentorGrid filters={filters} mentors={mentors} loading={loading} />
                </Content>
            </Layout>

            {/* 移动端 Drawer：把原来的 SearchFilters 塞进来 */}
            {isMobile && (
                <Drawer
                    title="Mentor Filters"
                    placement="left"
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    width={320}
                    destroyOnClose
                >
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
                    <Space style={{ width: "100%", marginTop: 8, justifyContent: "end" }}>
                        <Button type="primary" onClick={() => setFiltersOpen(false)}>
                            Save
                        </Button>
                    </Space>
                </Drawer>
            )}
        </Layout>
    );
}
