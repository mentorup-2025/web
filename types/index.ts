// create a type with a role enum, the value contains 'mentor' and 'mentee'
export enum Role {
  MENTOR = 'mentor',
  MENTEE = 'mentee'
}


// mentor list page types
interface Service {
  type: string;
  price: number;
}

export interface Mentor {
  user_id: string;
  username: string;
  profile_url: string;
  email: string;
  industries: string[];
  mentor: {
    title: string;
    introduction: string;
    company: string;
    years_of_experience: number;
    services: {
      [key: string]: Service;
    };
    user_id: string;
    created_at: string;
    default_ranking: number
  };
}

export type SortOption = 'price-asc' | 'price-desc' | 'yoe-asc' | 'yoe-desc' | null;

export interface SearchFiltersType {
  jobTitle?: string;
  industries?: string[];
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
  serviceTypes?: string[];
  company?: string[];
  sort?: SortOption;
}