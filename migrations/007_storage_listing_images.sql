-- Create public storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Public read listing-images'
  ) THEN
    CREATE POLICY "Public read listing-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'listing-images');
  END IF;
END $$;

-- Authenticated upload
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated upload listing-images'
  ) THEN
    CREATE POLICY "Authenticated upload listing-images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'listing-images');
  END IF;
END $$;

-- Owners can delete their own files (folder = user id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Owners delete listing-images'
  ) THEN
    CREATE POLICY "Owners delete listing-images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'listing-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
