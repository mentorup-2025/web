"use client";
import { Layout, Button, Drawer, Space } from "antd";
import { useState, useMemo, useEffect } from "react";
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

    // ====== 检测是否为移动端 ======
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 480px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener?.("change", update);
        return () => mq.removeEventListener?.("change", update);
    }, []);

    // ====== 控制 Drawer ======
    const [filtersOpen, setFiltersOpen] = useState(false);

    const handleFiltersChange = (newFilters: SearchFiltersType) => {
        setFilters(prev => ({ ...prev, ...newFilters }));   // ✅ 合并 patch
    };

    const handleTopFiltersPatch = (patch: Partial<SearchFiltersType>) => {
        setFilters(prev => ({ ...prev, ...patch }));
    };

    // ====== ✅ 仅对 “Available ASAP (next 7 days)” 做一次前端预过滤，其余筛选交给 MentorGrid ======
    const mentorsAfterASAP = useMemo(() => {
        if (filters.availableAsapWithin7Days && Array.isArray(filters.availableMentorIds)) {
            const allow = new Set(filters.availableMentorIds);
            return mentors.filter((m) => allow.has(m.user_id));
        }
        return mentors;
    }, [mentors, filters.availableAsapWithin7Days, filters.availableMentorIds]);

    // 供侧边栏筛选器计算范围
    const allYoes = useMemo(
        () => mentors.map((m) => Number(m.mentor.years_of_experience ?? 0)),
        [mentors]
    );
    const minYoe = allYoes.length ? Math.min(...allYoes) : 0;
    const maxYoe = allYoes.length ? Math.max(...allYoes) : 20;

    const allPrices = useMemo(
        () =>
            mentors
                .flatMap((m) =>
                    Object.values(m.mentor.services ?? {}).map((s) =>
                        typeof s === "number" ? Number(s) : Number((s as any)?.price)
                    )
                )
                .filter((v) => Number.isFinite(v)),
        [mentors]
    );
    const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length ? Math.max(...allPrices) : 200;

    // 侧边栏枚举
    const uniqueJobTitles = useMemo(
        () => Array.from(new Set(mentors.map((m) => m.mentor.title).filter(Boolean))),
        [mentors]
    );
    const uniqueIndustries = useMemo(
        () => Array.from(new Set(mentors.flatMap((m) => m.industries).filter(Boolean))),
        [mentors]
    );
    const uniqueServiceTypes = useMemo(
        () =>
            Array.from(
                new Set(
                    mentors.flatMap((m) =>
                        Object.entries(m.mentor.services ?? {}).map(([k, v]) =>
                            typeof v === "object" && v && "type" in v ? (v as any).type : k
                        )
                    )
                )
            ),
        [mentors]
    );
    const uniqueCompanies = useMemo(
        () => Array.from(new Set(mentors.map((m) => m.mentor.company).filter(Boolean))),
        [mentors]
    );

    // 统计当前已选筛选项个数（已把 jobTitle 改为多选）
    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (filters.jobTitle?.length) c += filters.jobTitle.length; // ✅ 改为累加多选数量
        if (filters.industries?.length) c += filters.industries.length;
        if (filters.company?.length) c += filters.company.length;
        if (filters.serviceTypes?.length) c += filters.serviceTypes.length;
        if (filters.minPrice != null || filters.maxPrice != null) c++;
        if (filters.minExperience != null || filters.maxExperience != null) c++;
        if (filters.availableAsapWithin7Days) c++; // ✅ ASAP 也算一个激活筛选
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
                    <div className={styles.topActions}>
                        <div className={styles.scrollableActions}>
                            {isMobile && (
                                <Button className={styles.filtersButtonMobile} onClick={() => setFiltersOpen(true)}>
                                    Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                                </Button>
                            )}
                            <TopSort onChange={handleTopFiltersPatch} currentFilters={filters} />
                        </div>
                    </div>

                    {/* ✅ 传入 mentorsAfterASAP，而不是原始 mentors */}
                    <MentorGrid filters={filters} mentors={mentorsAfterASAP} loading={loading} />
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
