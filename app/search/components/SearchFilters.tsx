'use client';

import { Layout, Collapse, Checkbox, Slider } from 'antd';
import styles from '../search.module.css';
import { useState, useEffect, useCallback } from 'react';

const { Sider } = Layout;
const { Panel } = Collapse;

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    jobTitle?: string;
    industries?: string[];
    minExperience?: number;
    maxExperience?: number;
    minPrice?: number;
    maxPrice?: number;
    serviceTypes?: string[];
  }) => void;
  jobTitles: string[];
  industries: string[];
  serviceTypes: string[];
  minPrice: number;
  maxPrice: number;
}

export default function SearchFilters({ 
  onFiltersChange, 
  jobTitles, 
  industries,
  serviceTypes,
  minPrice,
  maxPrice 
}: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    jobTitle: '',
    industries: [] as string[],
    minExperience: 1,
    maxExperience: 20,
    minPrice: minPrice,
    maxPrice: maxPrice,
    serviceTypes: [] as string[]
  });

  // Memoize the filter change handler
  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  // Only update parent when filters change
  useEffect(() => {
    handleFiltersChange(filters);
  }, [filters, handleFiltersChange]);

  const handleJobTitleChange = (title: string) => {
    setFilters(prev => ({
      ...prev,
      jobTitle: title
    }));
  };

  const handleIndustriesChange = (selectedIndustries: string[]) => {
    setFilters(prev => ({
      ...prev,
      industries: selectedIndustries
    }));
  };

  const handleServiceTypesChange = (selectedTypes: string[]) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: selectedTypes
    }));
  };

  const handleExperienceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      minExperience: value[0],
      maxExperience: value[1]
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      minPrice: value[0],
      maxPrice: value[1]
    }));
  };

  return (
    <Sider width={280} className={styles.sider}>
      <Collapse defaultActiveKey={['jobTitle']} ghost>
        <Panel header="Job Title" key="jobTitle">
          <Checkbox.Group 
            className={styles.checkboxGroup}
            onChange={(values) => handleJobTitleChange(values[0] as string)}
          >
            {jobTitles.map(title => (
              <Checkbox key={title} value={title}>
                {title}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>

        <Panel header="Industry" key="industry">
          <Checkbox.Group 
            className={styles.checkboxGroup}
            onChange={(values) => handleIndustriesChange(values as string[])}
          >
            {industries.map(industry => (
              <Checkbox key={industry} value={industry}>
                {industry}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>

        <Panel header="Years of Experience" key="experience">
          <Slider
            range
            min={1}
            max={20}
            defaultValue={[1, 20]}
            onChange={handleExperienceChange}
            marks={{
              1: '1',
              5: '5',
              10: '10',
              15: '15',
              20: '20+'
            }}
          />
        </Panel>

        <Panel header="Price Range" key="price">
          <Slider
            range
            min={minPrice}
            max={maxPrice}
            defaultValue={[minPrice, maxPrice]}
            onChange={handlePriceChange}
            marks={{
              [minPrice]: `$${minPrice}`,
              [Math.round((minPrice + maxPrice) / 4)]: `$${Math.round((minPrice + maxPrice) / 4)}`,
              [Math.round((minPrice + maxPrice) / 2)]: `$${Math.round((minPrice + maxPrice) / 2)}`,
              [Math.round((minPrice + maxPrice) * 3 / 4)]: `$${Math.round((minPrice + maxPrice) * 3 / 4)}`,
              [maxPrice]: `$${maxPrice}+`
            }}
          />
        </Panel>

        <Panel header="Service Type" key="serviceType">
          <Checkbox.Group 
            className={styles.checkboxGroup}
            onChange={(values) => handleServiceTypesChange(values as string[])}
          >
            {serviceTypes.map(type => (
              <Checkbox key={type} value={type}>
                {type}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>
      </Collapse>
    </Sider>
  );
} 