'use client';

import { Layout, Collapse, Checkbox, Slider, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useState } from 'react';
import styles from '../search.module.css';

const { Sider } = Layout;
const { Panel } = Collapse;

export default function SearchFilters() {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const jobTitles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Education'];
  const experiences = ['1-3 years', '3-5 years', '5-10 years', '10+ years'];
  const languages = ['English', 'Spanish', 'Chinese', 'French', 'German'];
  const availability = ['Weekdays', 'Weekends', 'Evenings', 'Mornings'];
  const mentorshipTypes = ['Career Guidance', 'Technical Skills', 'Leadership', 'Interview Prep'];

  return (
    <Sider width={280} className={styles.sider}>
      <Collapse defaultActiveKey={['jobTitle']} ghost>
        <Panel header="Job Title" key="jobTitle">
          <Checkbox.Group className={styles.checkboxGroup}>
            {jobTitles.map(title => (
              <Checkbox key={title} value={title}>
                {title}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>

        <Panel header="Industry" key="industry">
          <Checkbox.Group className={styles.checkboxGroup}>
            {industries.map(industry => (
              <Checkbox key={industry} value={industry}>
                {industry}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>

        <Panel header="Years of Experience" key="experience">
          <Checkbox.Group className={styles.checkboxGroup}>
            {experiences.map(exp => (
              <Checkbox key={exp} value={exp}>
                {exp}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Panel>

        <Panel header="Price Range" key="price">
          <Slider
            range
            min={0}
            max={500}
            defaultValue={[50, 200]}
            marks={{
              0: '$0',
              500: '$500'
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