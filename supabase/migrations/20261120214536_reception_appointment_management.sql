alter table public.appointments
  add column cancelled_at timestamptz,
  add column revision integer not null default 0;

-- Active appointments still use the same exclusion rule for both booking flows.
alter table public.appointments
  drop constraint appointments_no_overlap,
  add constraint appointments_no_overlap exclude using gist (
    appointment_date with =,
    dentist_id with =,
    int4range(starts_at_minute, ends_at_minute, '[)') with &&
  ) where (cancelled_at is null);

grant select (cancelled_at, revision, treatment_id, patient_name, patient_email, patient_phone)
  on table public.appointments to service_role;
grant update (appointment_date, starts_at_minute, ends_at_minute, cancelled_at, revision)
  on table public.appointments to service_role;

notify pgrst, 'reload schema';
