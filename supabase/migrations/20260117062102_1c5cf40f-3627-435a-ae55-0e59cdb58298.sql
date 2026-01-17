-- Fix critical security issue: Replace permissive RLS policies with authentication-based access
-- This addresses the PUBLIC_DATA_EXPOSURE finding for all patient-related tables

-- 1. Drop existing permissive policies on sensitive tables
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all access to dental_status" ON public.dental_status;
DROP POLICY IF EXISTS "Allow all access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all access to treatment_records" ON public.treatment_records;
DROP POLICY IF EXISTS "Allow all access to patient_documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Allow all operations on appointment_treatments" ON public.appointment_treatments;
DROP POLICY IF EXISTS "Allow all access to cabinets" ON public.cabinets;
DROP POLICY IF EXISTS "Allow all access to doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow all access to treatments" ON public.treatments;

-- 2. Create authentication-based policies for patients table
CREATE POLICY "Authenticated users can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (true);

-- 3. Create authentication-based policies for dental_status table
CREATE POLICY "Authenticated users can view dental_status"
ON public.dental_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert dental_status"
ON public.dental_status FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dental_status"
ON public.dental_status FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete dental_status"
ON public.dental_status FOR DELETE
TO authenticated
USING (true);

-- 4. Create authentication-based policies for appointments table
CREATE POLICY "Authenticated users can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (true);

-- 5. Create authentication-based policies for treatment_records table
CREATE POLICY "Authenticated users can view treatment_records"
ON public.treatment_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert treatment_records"
ON public.treatment_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update treatment_records"
ON public.treatment_records FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete treatment_records"
ON public.treatment_records FOR DELETE
TO authenticated
USING (true);

-- 6. Create authentication-based policies for patient_documents table
CREATE POLICY "Authenticated users can view patient_documents"
ON public.patient_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patient_documents"
ON public.patient_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient_documents"
ON public.patient_documents FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patient_documents"
ON public.patient_documents FOR DELETE
TO authenticated
USING (true);

-- 7. Create authentication-based policies for appointment_treatments table
CREATE POLICY "Authenticated users can view appointment_treatments"
ON public.appointment_treatments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert appointment_treatments"
ON public.appointment_treatments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointment_treatments"
ON public.appointment_treatments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointment_treatments"
ON public.appointment_treatments FOR DELETE
TO authenticated
USING (true);

-- 8. Create authentication-based policies for cabinets table
CREATE POLICY "Authenticated users can view cabinets"
ON public.cabinets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert cabinets"
ON public.cabinets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update cabinets"
ON public.cabinets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cabinets"
ON public.cabinets FOR DELETE
TO authenticated
USING (true);

-- 9. Create authentication-based policies for doctors table
CREATE POLICY "Authenticated users can view doctors"
ON public.doctors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert doctors"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctors"
ON public.doctors FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete doctors"
ON public.doctors FOR DELETE
TO authenticated
USING (true);

-- 10. Create authentication-based policies for treatments table
CREATE POLICY "Authenticated users can view treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert treatments"
ON public.treatments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update treatments"
ON public.treatments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete treatments"
ON public.treatments FOR DELETE
TO authenticated
USING (true);