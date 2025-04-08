import { Mentor } from "./mentor";

export interface User {
  id: string;           // Unique identifier
  username: string;     // User's chosen username
  email: string;        // User's email address
  created_at: string;   // ISO timestamp
  github?: string;      // Optional GitHub profile
  linkedin?: string;    // Optional LinkedIn profile
  resume?: string;      // Optional resume URL
  mentor?: Mentor | null; // Optional mentor ID, defaults to null
}

export interface CreateUserInput {
  username: string;
  email: string;
  github?: string;      // Optional GitHub profile
  linkedin?: string;    // Optional LinkedIn profile
  resume?: string;      // Optional resume URL
}

export interface UserCredentials {
  email: string;
}