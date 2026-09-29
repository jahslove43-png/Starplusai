-- Protect subscription/trial state, enforce active-trial writes, optimize RLS helper calls, and prevent duplicate reviews.
create or replace function public.prevent_business_billing_field_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if new.plan is distinct from old.plan
      or new.subscription_status is distinct from old.subscription_status
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.created_at is distinct from old.created_at then
      raise exception 'Protected business fields cannot be changed by the client';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_business_billing_fields on public.businesses;
create trigger protect_business_billing_fields before update on public.businesses for each row execute function public.prevent_business_billing_field_changes();
revoke execute on function public.prevent_business_billing_field_changes() from public, anon, authenticated;

-- Recreate owner policies using statement-cached auth.uid().
drop policy if exists businesses_insert_own on public.businesses;
drop policy if exists businesses_select_own on public.businesses;
drop policy if exists businesses_update_own on public.businesses;
create policy businesses_insert_own on public.businesses for insert to authenticated with check (id = (select auth.uid()));
create policy businesses_select_own on public.businesses for select to authenticated using (id = (select auth.uid()));
create policy businesses_update_own on public.businesses for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists customers_delete_own on public.customers;
drop policy if exists customers_insert_own on public.customers;
drop policy if exists customers_select_own on public.customers;
drop policy if exists customers_update_own on public.customers;
create policy customers_delete_own on public.customers for delete to authenticated using (business_id = (select auth.uid()));
create policy customers_insert_own on public.customers for insert to authenticated with check (business_id = (select auth.uid()) and exists (select 1 from public.businesses b where b.id = (select auth.uid()) and (b.subscription_status = 'active' or (b.subscription_status = 'trial' and b.trial_ends_at > now()))));
create policy customers_select_own on public.customers for select to authenticated using (business_id = (select auth.uid()));
create policy customers_update_own on public.customers for update to authenticated using (business_id = (select auth.uid())) with check (business_id = (select auth.uid()));

drop policy if exists review_requests_delete_own on public.review_requests;
drop policy if exists review_requests_insert_own on public.review_requests;
drop policy if exists review_requests_select_own on public.review_requests;
drop policy if exists review_requests_update_own on public.review_requests;
create policy review_requests_delete_own on public.review_requests for delete to authenticated using (business_id = (select auth.uid()));
create policy review_requests_insert_own on public.review_requests for insert to authenticated with check (business_id = (select auth.uid()) and exists (select 1 from public.businesses b where b.id = (select auth.uid()) and (b.subscription_status = 'active' or (b.subscription_status = 'trial' and b.trial_ends_at > now()))));
create policy review_requests_select_own on public.review_requests for select to authenticated using (business_id = (select auth.uid()));
create policy review_requests_update_own on public.review_requests for update to authenticated using (business_id = (select auth.uid())) with check (business_id = (select auth.uid()));

drop policy if exists reviews_delete_own on public.reviews;
drop policy if exists reviews_insert_own on public.reviews;
drop policy if exists reviews_select_own on public.reviews;
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_delete_own on public.reviews for delete to authenticated using (business_id = (select auth.uid()));
create policy reviews_insert_own on public.reviews for insert to authenticated with check (business_id = (select auth.uid()));
create policy reviews_select_own on public.reviews for select to authenticated using (business_id = (select auth.uid()));
create policy reviews_update_own on public.reviews for update to authenticated using (business_id = (select auth.uid())) with check (business_id = (select auth.uid()));

create unique index if not exists review_requests_public_token_uidx on public.review_requests(public_token);
create unique index if not exists reviews_one_per_request_uidx on public.reviews(review_request_id) where review_request_id is not null;
create index if not exists reviews_customer_id_idx on public.reviews(customer_id);
create index if not exists reviews_review_request_id_idx on public.reviews(review_request_id);
