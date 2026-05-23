DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;

CREATE POLICY "Signed-in users can upload product images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can update product images"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can delete product images"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);