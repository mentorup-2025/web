import { Mentor } from "./mentor";

export interface User {
  id: string;           // Unique identifier
  username: string;     // User's chosen username
  email: string;        // User's email address
  created_at: string;   // ISO timestamp
  github?: string;      // Optional GitHub profile
  linkedin?: string;    // Optional LinkedIn profile
  resume?: string;      // Optional resume URL
  industries?: string[]; // Optional industries
  wechat?: string;      // Optional WeChat ID
  status?: UserStatus;  // Optional status
  job_target?: JobTarget | null; // Optional job target
  mentor?: Mentor | null; // Optional mentor ID, defaults to null
}

export interface CreateUserInput {
  username: string;
  email: string;
  github?: string;      // Optional GitHub profile
  linkedin?: string;    // Optional LinkedIn profile
  industries?: string[]; // Optional industries
  wechat?: string;      // Optional WeChat ID
  resume?: string;      // Optional resume URL
  status?: UserStatus;  // Optional status
}

export interface UpdateUserInput {
  username?: string | null;     // Optional username update
  email?: string | null;        // Optional email update
  github?: string | null;       // Optional GitHub profile update
  linkedin?: string | null;     // Optional LinkedIn profile update
  resume?: string | null;       // Optional resume URL update
  industries?: string[] | null; // Optional industries update
  wechat?: string | null;       // Optional WeChat ID update
  status?: UserStatus | null;   // Optional status update
  job_target?: JobTarget | null; // Optional job target update
}

export interface UserCredentials {
  email: string;
}

export enum UserStatus {
  STUDENT = 'Student',
  NEW_GRADUATE = 'New Graduate',
  EMPLOYED = 'Employed',
  UNEMPLOYED = 'Unemployed',
  CAREER_SWITCH = 'Career Switch',
  FREELANCER = 'Freelancer'
}

export type JobTarget = {
  title?: string;
  industry?: string;
  location?: string;
  [key: string]: any; // Allow for future extensibility
};