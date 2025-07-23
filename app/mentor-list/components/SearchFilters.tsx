'use client';

import { Layout, Collapse, Checkbox, Slider } from 'antd';
import styles from '../search.module.css';
import { useState, useEffect, useCallback } from 'react';

const { Sider } = Layout;
const { Panel } = Collapse;

// Add prop type
type SearchFiltersProps = {
  onFiltersChange: (newFilters: any) => void;
  jobTitles: string[];
  industries: string[];
  serviceTypes: string[];
  minPrice: number;
  maxPrice: number;
  uniqueCompanies: string[];
};

export default function SearchFilters({ 
  onFiltersChange, 
  jobTitles, 
  industries,
  serviceTypes,
  minPrice,
  maxPrice,
  uniqueCompanies,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    jobTitle: '',
    industries: [] as string[],
    minExperience: 1,
    maxExperience: 20,
    minPrice: minPrice,
    maxPrice: maxPrice,
    serviceTypes: [] as string[],
    company: [] as string[],
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

  const handleCompanyChange = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      company: values
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

        {/* New Company Panel */}
        <Panel header="Company" key="company">
          <Checkbox.Group
            className={styles.checkboxGroup}
            onChange={(values) => handleCompanyChange(values as string[])}
          >
            {uniqueCompanies && uniqueCompanies.map(company => (
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