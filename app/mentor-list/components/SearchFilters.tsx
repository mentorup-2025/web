'use client';

import { Layout, Collapse, Checkbox, Slider, Divider } from 'antd';
import {
    UserOutlined,
    AppstoreOutlined,
    ToolOutlined,
    BankOutlined,
} from '@ant-design/icons';
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
    const set = (patch: Partial<SearchFiltersType>) => {
        onFiltersChange({ ...value, ...patch });
    };

    /** 渲染带左侧图标的分组标题 */
    const renderHeader = (icon: React.ReactNode, text: string) => (
        <div className={styles.filterHeader}>
            <span className={styles.filterHeaderIcon}>{icon}</span>
            <span className={styles.filterHeaderText}>{text}</span>
        </div>
    );

    /** 顶部快捷筛选：Free Coffee Chat 同步到 serviceTypes */
    const onToggleFreeCoffee = (checked: boolean) => {
        const cur = new Set<string>(value.serviceTypes ?? []);
        if (checked) cur.add(FREE_COFFEE_LABEL);
        else cur.delete(FREE_COFFEE_LABEL);
        set({
            serviceTypes: Array.from(cur),
            offersFreeCoffeeChat: checked,
        });
    };

    const isCoffeeChecked =
        value.offersFreeCoffeeChat ?? (value.serviceTypes ?? []).includes(FREE_COFFEE_LABEL);

    return (
        <Sider width={280} className={styles.sider}>
            {/* 顶部两个快捷 Checkboxes —— 与下方面板相同的结构与样式 */}
            <div className={styles.checkboxGroupCol} style={{ padding: '12px 16px 4px' }}>
                <label className={styles.filterItem}>
                    <Checkbox
                        className={styles.filterCheckbox}
                        checked={Boolean(value.availableAsapWithin7Days)}
                        onChange={(e) => set({ availableAsapWithin7Days: e.target.checked })}
                    />
                    <span className={styles.filterLabel}>Available ASAP (next 7 days)</span>
                </label>

                <label className={styles.filterItem}>
                    <Checkbox
                        className={styles.filterCheckbox}
                        checked={isCoffeeChecked}
                        onChange={(e) => onToggleFreeCoffee(e.target.checked)}
                    />
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
                <Panel header={renderHeader(<UserOutlined />, 'Job Title')} key="jobTitle">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.jobTitle ? [value.jobTitle] : []}
                        onChange={(vals) => set({ jobTitle: (vals?.[0] as string) ?? '' })}
                    >
                        {jobTitles.map((title) => (
                            <label key={title} className={styles.filterItem}>
                                <Checkbox value={title} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{title}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<AppstoreOutlined />, 'Industry')} key="industry">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.industries ?? []}
                        onChange={(vals) => set({ industries: vals as string[] })}
                    >
                        {industries.map((industry) => (
                            <label key={industry} className={styles.filterItem}>
                                <Checkbox value={industry} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{industry}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<ToolOutlined />, 'Service')} key="serviceType">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.serviceTypes ?? []}
                        onChange={(vals) => set({ serviceTypes: vals as string[] })}
                    >
                        {serviceTypes.map((type) => (
                            <label key={type} className={styles.filterItem}>
                                <Checkbox value={type} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{type}</span>
                            </label>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header={renderHeader(<BankOutlined />, 'Company')} key="company">
                    <Checkbox.Group
                        className={styles.checkboxGroupCol}
                        value={value.company ?? []}
                        onChange={(vals) => set({ company: vals as string[] })}
                    >
                        {uniqueCompanies?.map((company) => (
                            <label key={company} className={styles.filterItem}>
                                <Checkbox value={company} className={styles.filterCheckbox} />
                                <span className={styles.filterLabel}>{company}</span>
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
                                set({ minExperience: (rng as number[])[0], maxExperience: (rng as number[])[1] })
                            }
                            marks={{ [minYoe]: `${minYoe}`, [maxYoe]: `${maxYoe}+` }}
                        />
                    </div>
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
                            onChange={(rng) => set({ minPrice: (rng as number[])[0], maxPrice: (rng as number[])[1] })}
                            marks={{ [minPrice]: `$${minPrice}`, [maxPrice]: `$${maxPrice}+` }}
                        />
                    </div>
                </Panel>
            </Collapse>
        </Sider>
    );
}
