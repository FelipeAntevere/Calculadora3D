-- Create expenses table
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  description text not null,
  category text not null,
  amount numeric not null,
  due_date date not null,
  status text default 'Pendente',
  paid_date date,
  created_at timestamptz default now()
);

-- RLS Policies (Adjust as needed for your specific auth setup)
alter table expenses enable row level security;

create policy "Users can view their own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on expenses for delete
  using (auth.uid() = user_id);
