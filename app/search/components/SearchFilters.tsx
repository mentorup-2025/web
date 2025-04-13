'use client';

import { Layout, Collapse, Checkbox, Slider, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import styles from '../search.module.css';

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
  }) => void;
}

export default function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobTitle: '',
    industries: [] as string[],
    minExperience: 0,
    maxExperience: 50,
    minPrice: 0,
    maxPrice: 500
  });

  const jobTitles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce'];
  const experiences = ['1-3 years', '3-5 years', '5-10 years', '10+ years'];
  const languages = ['English', 'Spanish', 'Chinese', 'French', 'German'];
  const availability = ['Weekdays', 'Weekends', 'Evenings', 'Mornings'];
  const mentorshipTypes = ['Career Guidance', 'Technical Skills', 'Leadership', 'Interview Prep'];

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

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

  const handleExperienceChange = (value: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      minExperience: value[0],
      maxExperience: value[1]
    }));
  };

  const handlePriceChange = (value: [number, number]) => {
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
            min={0}
            max={50}
            defaultValue={[0, 50]}
            onChange={handleExperienceChange}
            marks={{
              0: '0',
              10: '10',
              20: '20',
              30: '30',
              40: '40',
              50: '50+'
            }}
          />
        </Panel>

        <Panel header="Price Range" key="price">
          <Slider
            range
            min={0}
            max={500}
            defaultValue={[0, 500]}
            onChange={handlePriceChange}
            marks={{
              0: '$0',
              100: '$100',
              200: '$200',
              300: '$300',
              400: '$400',
              500: '$500+'
            }}
          />
        </Panel>
      </Collapse>

      <div className={styles.moreFiltersButton}>
        <Button 
          type="text" 
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          icon={showMoreFilters ? <UpOutlined /> : <DownOutlined />}
          block
        >
          {showMoreFilters ? 'Less Filters' : 'More Filters'}
        </Button>
      </div>

      {showMoreFilters && (
        <Collapse ghost className={styles.additionalFilters}>
          <Panel header="Languages" key="languages">
            <Checkbox.Group className={styles.checkboxGroup}>
              {languages.map(language => (
                <Checkbox key={language} value={language}>
                  {language}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Panel>

          <Panel header="Availability" key="availability">
            <Checkbox.Group className={styles.checkboxGroup}>
              {availability.map(time => (
                <Checkbox key={time} value={time}>
                  {time}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Panel>

          <Panel header="Mentorship Type" key="mentorshipType">
            <Checkbox.Group className={styles.checkboxGroup}>
              {mentorshipTypes.map(type => (
                <Checkbox key={type} value={type}>
                  {type}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Panel>
        </Collapse>
      )}
    </Sider>
  );
} 