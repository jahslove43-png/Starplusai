-- Initialize the current 3-day trial in the database auth trigger.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.businesses (id, name, email, plan, subscription_status, trial_ends_at)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'My Business'),
    new.email,
    'trial',
    'trial',
    now() + interval '3 days'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case when public.businesses.name = 'My Business' then excluded.name else public.businesses.name end,
        updated_at = now();
  return new;
end;
$$;
