-- Storage bucket for product images
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;

-- Allow public read access to product images
create policy "Public can read products bucket"
on storage.objects for select
using (bucket_id = 'products');

-- Allow authenticated users to upload product images
create policy "Authenticated can upload products bucket"
on storage.objects for insert
with check (bucket_id = 'products' and auth.role() = 'authenticated');

-- Allow authenticated users to update/delete their own product images
create policy "Authenticated can update products bucket"
on storage.objects for update
with check (bucket_id = 'products' and auth.role() = 'authenticated');
