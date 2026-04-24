-- Create private bucket for HR documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Admins manage all files in documents bucket
CREATE POLICY "Admins manage documents bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Authenticated users can read documents (RLS on documents table controls visibility)
CREATE POLICY "Authenticated read documents bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
