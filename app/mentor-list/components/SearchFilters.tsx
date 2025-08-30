'use client';

import { Layout, Collapse, Checkbox, Slider } from 'antd';
import styles from '../search.module.css';
import type { SearchFiltersType } from '../../../types';

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

    return (
        <Sider width={280} className={styles.sider}>
            <Collapse defaultActiveKey={['jobTitle']} ghost>
                <Panel header="Job Title" key="jobTitle">
                    <Checkbox.Group
                        className={styles.checkboxGroup}
                        value={value.jobTitle ? [value.jobTitle] : []}
                        onChange={(vals) => set({ jobTitle: (vals?.[0] as string) ?? '' })}
                    >
                        {jobTitles.map((title) => (
                            <Checkbox key={title} value={title}>
                                {title}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header="Industry" key="industry">
                    <Checkbox.Group
                        className={styles.checkboxGroup}
                        value={value.industries ?? []}
                        onChange={(vals) => set({ industries: vals as string[] })}
                    >
                        {industries.map((industry) => (
                            <Checkbox key={industry} value={industry}>
                                {industry}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header="Years of Experience" key="experience">
                    <Slider
                        range
                        min={minYoe}
                        max={maxYoe}
                        value={[
                            value.minExperience !== undefined ? value.minExperience : minYoe,
                            value.maxExperience !== undefined ? value.maxExperience : maxYoe
                        ]}
                        onChange={(rng) =>
                            set({ minExperience: (rng as number[])[0], maxExperience: (rng as number[])[1] })
                        }
                        marks={{ [minYoe]: `${minYoe}`, [maxYoe]: `${maxYoe}+` }}
                    />
                </Panel>

                <Panel header="Price Range" key="price">
                    <Slider
                        range
                        min={minPrice}
                        max={maxPrice}
                        value={[
                            value.minPrice !== undefined ? value.minPrice : minPrice,
                            value.maxPrice !== undefined ? value.maxPrice : maxPrice
                        ]}
                        onChange={(rng) =>
                            set({ minPrice: (rng as number[])[0], maxPrice: (rng as number[])[1] })
                        }
                        marks={{
                            [minPrice]: `$${minPrice}`,
                            [maxPrice]: `$${maxPrice}+`,
                        }}
                    />
                </Panel>

                <Panel header="Service Type" key="serviceType">
                    <Checkbox.Group
                        className={styles.checkboxGroup}
                        value={value.serviceTypes ?? []}
                        onChange={(vals) => set({ serviceTypes: vals as string[] })}
                    >
                        {serviceTypes.map((type) => (
                            <Checkbox key={type} value={type}>
                                {type}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Panel>

                <Panel header="Company" key="company">
                    <Checkbox.Group
                        className={styles.checkboxGroup}
                        value={value.company ?? []}
                        onChange={(vals) => set({ company: vals as string[] })}
                    >
                        {uniqueCompanies?.map((company) => (
                            <Checkbox key={company} value={company}>
                                {company}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Panel>
            </Collapse>
        </Sider>
    );
}