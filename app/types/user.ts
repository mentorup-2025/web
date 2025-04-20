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
}

export interface UpdateUserInput {
  username?: string | null;     // Optional username update
  email?: string | null;        // Optional email update
  github?: string | null;       // Optional GitHub profile update
  linkedin?: string | null;     // Optional LinkedIn profile update
  resume?: string | null;       // Optional resume URL update
  industries?: string[] | null; // Optional industries update
  wechat?: string | null;       // Optional WeChat ID update
}

export interface UserCredentials {
  email: string;
}