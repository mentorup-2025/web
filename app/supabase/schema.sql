-- Users table
create table users (
  user_id uuid primary key default uuid_generate_v4(),
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

-- Mentors table
create table mentors (
  user_id uuid primary key references users(user_id),
  role text not null,
  industry text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table mentor_availability (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_time_range check (start_time < end_time)
);

-- 创建更新时间触发器
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_mentor_availability_updated_at
  before update on mentor_availability
  for each row
  execute function update_updated_at_column();

-- 添加 RLS 策略
alter table mentor_availability enable row level security;

create policy "Users can read their own availability"
  on mentor_availability for select
  using (auth.uid() = user_id);

create policy "Users can insert their own availability"
  on mentor_availability for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own availability"
  on mentor_availability for update
  using (auth.uid() = user_id);

create policy "Users can delete their own availability"
  on mentor_availability for delete
  using (auth.uid() = user_id);