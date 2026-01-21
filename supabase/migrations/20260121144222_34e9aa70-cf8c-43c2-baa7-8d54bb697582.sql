-- Add doctor code field for prescription stamps
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_code VARCHAR(20);

-- Add comments to clarify the purpose
COMMENT ON COLUMN public.doctors.doctor_code IS 'Medical license code displayed on prescriptions and stamps';