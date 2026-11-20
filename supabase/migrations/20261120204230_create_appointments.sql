create extension if not exists btree_gist with schema extensions;

create table if not exists public.appointments (
  id uuid primary key,
  appointment_date date not null,
  dentist_id text not null,
  treatment_id text not null,
  starts_at_minute smallint not null,
  ends_at_minute smallint not null,
  patient_name text not null check (char_length(patient_name) between 2 and 120),
  patient_email text not null check (char_length(patient_email) between 3 and 254),
  patient_phone text not null check (char_length(patient_phone) between 7 and 30),
  request_fingerprint text not null check (char_length(request_fingerprint) = 64),
  created_at timestamptz not null default now(),
  constraint appointments_within_day check (
    starts_at_minute >= 0 and ends_at_minute > starts_at_minute and ends_at_minute <= 1440
  ),
  constraint appointments_no_overlap exclude using gist (
    appointment_date with =,
    dentist_id with =,
    int4range(starts_at_minute, ends_at_minute, '[)') with &&
  )
);

alter table public.appointments enable row level security;
revoke all on table public.appointments from public, anon, authenticated, service_role;

grant select (id, appointment_date, dentist_id, starts_at_minute, ends_at_minute, request_fingerprint)
  on table public.appointments to service_role;
grant insert (
  id, appointment_date, dentist_id, treatment_id, starts_at_minute, ends_at_minute,
  patient_name, patient_email, patient_phone, request_fingerprint
) on table public.appointments to service_role;

notify pgrst, 'reload schema';
