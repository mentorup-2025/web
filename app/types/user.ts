export interface User {
  id: string;           // Unique identifier
  username: string;     // User's chosen username
  email: string;        // User's email address
  password_hash: string; // Hashed password (never store plain passwords)
  created_at: string;   // ISO timestamp
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;    // Plain password (will be hashed before storage)
}

export interface UserCredentials {
  email: string;
  password: string;
} 