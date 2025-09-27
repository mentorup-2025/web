'use client';

import { Layout, Collapse, Checkbox, Slider, Divider, message, Input } from 'antd';
import { UserOutlined, AppstoreOutlined, ToolOutlined, BankOutlined, FieldTimeOutlined, GiftOutlined } from '@ant-design/icons';

import styles from '../search.module.css';
import type { SearchFiltersType } from '../../../types';
import React from 'react';

const { Sider } = Layout;
const { Panel } = Collapse;

type SearchFiltersProps = {
    value: SearchFiltersType;
    onFiltersChange: (newFilters: SearchFiltersType) => void;
    jobTitles: string[];
    industries: string[];
    serviceTypes: string[];
    minPrice: number;
    maxPrice: number;
    uniqueCompanies: string[];
    minYoe: number;
    maxYoe: number;
};

const FREE_COFFEE_LABEL = 'Free Coffee Chat (15 Mins)';

export default function SearchFilters({
                                          value,
                                          onFiltersChange,
                                          jobTitles,
                                          industries,
                                          serviceTypes,
                                          minPrice,
                                          maxPrice,
                                          uniqueCompanies,
                                          minYoe,
                                          maxYoe,
                                      }: SearchFiltersProps) {
    const [loadingASAP, setLoadingASAP] = React.useState(false);
    const inFlightRef = React.useRef(false);
    const controllerRef = React.useRef<AbortController | null>(null);
    const wantedRef = React.useRef<boolean>(Boolean(value.availableAsapWithin7Days));

    // Company text search
    const [companyQuery, setCompanyQuery] = React.useState('');
    const filteredCompanies = React.useMemo(() => {
        const q = companyQuery.trim().toLowerCase();
        if (!q) return uniqueCompanies;
        return uniqueCompanies.filter((c) => c.toLowerCase().includes(q));
    }, [companyQuery, uniqueCompanies]);

    // 只上报 patch，由父组件合并
    const patch = (p: Partial<SearchFiltersType>) => {
        onFiltersChange(p as SearchFiltersType);
    };

    const renderHeader = (icon: React.ReactNode, text: string) => (
        <div className={styles.filterHeader}>
            <span className={styles.filterHeaderIcon}>{icon}</span>
            <span className={styles.filterHeaderText}>{text}</span>
        </div>
    );

    const onToggleFreeCoffee = (checked: boolean) => {
        const cur = new Set<string>(value.serviceTypes ?? []);
        if (checked) cur.add(FREE_COFFEE_LABEL);
        else cur.delete(FREE_COFFEE_LABEL);
        patch({
            serviceTypes: Array.from(cur),
            offersFreeCoffeeChat: checked,
        });
    };

    const isCoffeeChecked =
        value.offersFreeCoffeeChat ?? (value.serviceTypes ?? []).includes(FREE_COFFEE_LABEL);

    const extractIds = (raw: unknown): string[] => {
        if (!Array.isArray(raw) || raw.length === 0) return [];
        if (typeof raw[0] === 'string') return raw as string[];
        return (raw as Array<{ id?: string; user_id?: string }>)
            .map((r) => r.id ?? r.user_id)
            .filter(Boolean) as string[];
    };

    const onToggleAvailableASAP = async (checked: boolean) => {
        wantedRef.current = checked;
        patch({ availableAsapWithin7Days: checked });

        if (!checked) {
            patch({ availableMentorIds: undefined });
            if (inFlightRef.current) {
                try {
                    controllerRef.current?.abort();
                } catch {}
                inFlightRef.current = false;
            }
            setLoadingASAP(false);
            return;
        }

        if (inFlightRef.current) return;

        inFlightRef.current = true;
        setLoadingASAP(true);
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const res = await fetch('/api/availability/free_soon', {
                cache: 'no-store',
                signal: controller.signal,
            });
            const json = await res.json();

            if (!wantedRef.current) return;

            if (res.ok && json?.code === 0) {
                const mentorIds = extractIds(json.data);
                patch({ availableMentorIds: mentorIds });
                if (mentorIds.length === 0) {
                    message.info('未来 7 天暂无可预约导师');
                }
            } else {
                patch({ availableAsapWithin7Days: false, availableMentorIds: undefined });
                message.error(json?.message || '获取未来 7 天可预约导师失败，请稍后重试');
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                patch({ availableAsapWithin7Days: false, availableMentorIds: undefined });
                message.error('网络异常，获取可预约导师失败');
            }
        } finally {
            inFlightRef.current = false;
            setLoadingASAP(false);
            controllerRef.current = null;
        }
    };

    const disableASAPCheckbox = false; // 允许随时点/取消

    // 将选中的显示项映射回实际的服务类型
    const mapSelectedToServiceTypes = (selectedDisplays: string[]): string[] => {
        const mapping = {
            'Free Coffee Chat (15 Mins)': ['Free Coffee Chat (15 Mins)'],
            'Resume Review': ['Resume Review', 'Job Search Guidance'],
            'Mock Interview': ['Mock Interview', 'Behavioral Question Coaching'],
            'Career & Promotion': [
                'General Career Advice',
                'Salary Negotiation',
                'Promotion Strategy',
                'My Company / Role Deep Dive'
            ],
            'Grad School Application Advice': ['Grad School Application Advice']
        };

        return selectedDisplays.flatMap(display => mapping[display as keyof typeof mapping] || []);
    };

// 将实际的服务类型映射回显示项（用于初始化选中状态）
    const getCheckedServiceTypes = (serviceTypes: string[]): string[] => {
        const mapping = [
            { display: 'Free Coffee Chat (15 Mins)', values: ['Free Coffee Chat (15 Mins)'] },
            { display: 'Resume Review', values: ['Resume Review', 'Job Search Guidance'] },
            { display: 'Mock Interview', values: ['Mock Interview', 'Behavioral Question Coaching'] },
            {
                display: 'Career & Promotion',
                values: [
                    'General Career Advice',
                    'Salary Negotiation',
                    'Promotion Strategy',
                    'My Company / Role Deep Dive'
                ]
            },
            { display: 'Grad School Application Advice', values: ['Grad School Application Advice'] }
        ];

        return mapping
            .filter(item => item.values.some(value => serviceTypes.includes(value)))
            .map(item => item.display);
    };

    return (
        <Sider width={280} className={styles.sider}>
            <div className={styles.checkboxGroupCol} style={{ padding: '12px 16px 4px' }}>
                <label className={styles.filterItem}>
                    <Checkbox
                        className={styles.filterCheckbox}
                        checked={Boolean(value.availableAsapWithin7Days)}
                        onChange={(e) => onToggleAvailableASAP(e.target.checked)}
                        disabled={disableASAPCheckbox}
                    />
                    <FieldTimeOutlined className={styles.filterIcon} />
                    <span className={styles.filterLabel}>
            {loadingASAP && !value.availableAsapWithin7Days ? 'Loading… ' : ''}
                        Available ASAP (in 7 days)
          </span>
                </label>

                <label className={styles.filterItem}>
                    <Checkbox
                        className={styles.filterCheckbox}
                        checked={isCoffeeChecked}
                        onChange={(e) => onToggleFreeCoffee(e.target.checked)}
                    />
                    <GiftOutlined className={styles.filterIcon} />
                    <span className={styles.filterLabel}>Offers Free Coffee Chat</span>
                </label>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <Collapse
                defaultActiveKey={['jobTitle', 'industry', 'serviceType']}
                ghost
                expandIconPosition="end"
                className={styles.siderCollapse}
            >
                {/* ✅ Job Title 改为“多选数组”，逻辑与 Industry 一致 */}
                <Panel header={renderHeader(<UserOutlined />, 'Job Title')} key="jobTitle">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.jobTitle ?? []}
                        onChange={(vals) => patch({ jobTitle: vals as string[] })}
                    >
                        {jobTitles.map((title) => (
                            <label key={title} className={styles.filterItem}>
                                <Checkbox value={title} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{title}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<ToolOutlined />, 'Service')} key="serviceType">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={getCheckedServiceTypes(value.serviceTypes ?? [])}
                        onChange={(vals) => patch({ serviceTypes: mapSelectedToServiceTypes(vals as string[]) })}
                    >
                        {[
                            { display: 'Free Coffee Chat (15 Mins)', values: ['Free Coffee Chat (15 Mins)'] },
                            {
                                display: 'Resume Review',
                                values: ['Resume review', 'Job Search Guidance']
                            },
                            {
                                display: 'Mock Interview',
                                values: ['Mock Interview', 'Behavioral Question Coaching']
                            },
                            {
                                display: 'Career & Promotion',
                                values: [
                                    'General Career Advice',
                                    'Salary Negotiation',
                                    'Promotion Strategy',
                                    'My Company / Role Deep Dive'
                                ]
                            },
                            {
                                display: 'Grad School Application Advice',
                                values: ['Grad School Application Advice']
                            }
                        ].map((item) => (
                            <label key={item.display} className={styles.filterItem}>
                                <Checkbox value={item.display} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{item.display}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<ToolOutlined />, 'Years of Experience')} key="experience">
                    <div className={styles.sliderWrap}>
                        <Slider
                            range
                            min={minYoe}
                            max={maxYoe}
                            value={[
                                value.minExperience !== undefined ? value.minExperience : minYoe,
                                value.maxExperience !== undefined ? value.maxExperience : maxYoe,
                            ]}
                            onChange={(rng) =>
                                patch({
                                    minExperience: (rng as number[])[0],
                                    maxExperience: (rng as number[])[1],
                                })
                            }
                            marks={{ [minYoe]: `${minYoe}`, [maxYoe]: `${maxYoe}+` }}
                        />
                    </div>
                </Panel>

                <Panel header={renderHeader(<BankOutlined />, 'Company')} key="company">
                    {/* 🔎 文本搜索框（顶部） */}
                    <div style={{ padding: '0 8px 8px' }}>
                        <Input
                            allowClear
                            placeholder="Search company..."
                            value={companyQuery}
                            onChange={(e) => setCompanyQuery(e.target.value)}
                            size="middle"
                        />
                    </div>

                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.company ?? []}
                        onChange={(vals) => patch({ company: vals as string[] })}
                    >
                        {(filteredCompanies.length > 0 ? filteredCompanies : []).map((company) => (
                            <label key={company} className={styles.filterItem}>
                                <Checkbox value={company} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{company}</span>
                            </label>
                        ))}

                        {/* 空状态（无匹配项） */}
                        {filteredCompanies.length === 0 && (
                            <div style={{ padding: '8px 12px', color: 'var(--ant-color-text-tertiary)' }}>
                                No companies found
                            </div>
                        )}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<AppstoreOutlined />, 'Industry')} key="industry">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.industries ?? []}
                        onChange={(vals) => patch({ industries: vals as string[] })}
                    >
                        {industries.map((industry) => (
                            <label key={industry} className={styles.filterItem}>
                                <Checkbox value={industry} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{industry}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<ToolOutlined />, 'Price Range')} key="price">
                    <div className={styles.sliderWrap}>
                        <Slider
                            range
                            min={minPrice}
                            max={maxPrice}
                            value={[
                                value.minPrice !== undefined ? value.minPrice : minPrice,
                                value.maxPrice !== undefined ? value.maxPrice : maxPrice,
                            ]}
                            onChange={(rng) =>
                                patch({
                                    minPrice: (rng as number[])[0],
                                    maxPrice: (rng as number[])[1],
                                })
                            }
                            marks={{ [minPrice]: `$${minPrice}`, [maxPrice]: `$${maxPrice}+` }}
                        />
                    </div>
                </Panel>
            </Collapse>
        </Sider>
    );
}
