-- Create enum for roles
create type public.app_role as enum ('administrador', 'tecnico', 'ventas', 'inventario');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_completo text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user_roles table (CRITICAL: roles in separate table for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Create security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.has_role(auth.uid(), 'administrador'));

create policy "Admins can update all profiles"
  on public.profiles
  for update
  using (public.has_role(auth.uid(), 'administrador'));

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles
  for select
  using (public.has_role(auth.uid(), 'administrador'));

create policy "Admins can insert roles"
  on public.user_roles
  for insert
  with check (public.has_role(auth.uid(), 'administrador'));

create policy "Admins can update roles"
  on public.user_roles
  for update
  using (public.has_role(auth.uid(), 'administrador'));

create policy "Admins can delete roles"
  on public.user_roles
  for delete
  using (public.has_role(auth.uid(), 'administrador'));

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();