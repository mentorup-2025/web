-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint username_length check (char_length(username) >= 3),
  constraint email_valid check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for faster lookups
create index users_email_idx on users (email);
create index users_username_idx on users (username); 