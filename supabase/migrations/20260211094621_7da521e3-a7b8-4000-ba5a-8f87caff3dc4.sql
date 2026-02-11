
-- Catalog of dental conditions (afecțiuni)
CREATE TABLE public.dental_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dental_conditions" ON public.dental_conditions FOR SELECT USING (true);
CREATE POLICY "Admins can insert dental_conditions" ON public.dental_conditions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update dental_conditions" ON public.dental_conditions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete dental_conditions" ON public.dental_conditions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Junction: conditions assigned to patient teeth
CREATE TABLE public.tooth_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number integer NOT NULL,
  condition_id uuid NOT NULL REFERENCES public.dental_conditions(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(patient_id, tooth_number, condition_id)
);

ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tooth_conditions" ON public.tooth_conditions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert tooth_conditions" ON public.tooth_conditions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update tooth_conditions" ON public.tooth_conditions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete tooth_conditions" ON public.tooth_conditions FOR DELETE USING (true);

-- Junction: interventions (treatments) linked to patient teeth
CREATE TABLE public.tooth_interventions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number integer NOT NULL,
  treatment_id uuid REFERENCES public.treatments(id),
  treatment_name text NOT NULL,
  doctor_id uuid REFERENCES public.doctors(id),
  notes text,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tooth_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tooth_interventions" ON public.tooth_interventions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert tooth_interventions" ON public.tooth_interventions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update tooth_interventions" ON public.tooth_interventions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete tooth_interventions" ON public.tooth_interventions FOR DELETE USING (true);

-- Patient-level dental fields
ALTER TABLE public.patients
  ADD COLUMN is_implant_patient boolean DEFAULT false,
  ADD COLUMN has_dental_appliance boolean DEFAULT false,
  ADD COLUMN is_periodontal_patient boolean DEFAULT false,
  ADD COLUMN is_edentulous boolean DEFAULT false,
  ADD COLUMN is_finalized boolean DEFAULT false,
  ADD COLUMN diag_ocluzal text,
  ADD COLUMN diag_parodontal text,
  ADD COLUMN diag_ortodontic text,
  ADD COLUMN diag_odontal text,
  ADD COLUMN diag_chirurgical text;

-- Seed initial dental conditions catalog
INSERT INTO public.dental_conditions (name, code, sort_order) VALUES
  ('Absent', 'aa', 1),
  ('Breșă închisă', 'bi', 2),
  ('Carie avansată', 'ca', 3),
  ('Carie de colet', 'cc', 4),
  ('Carie incipientă', 'ci', 5),
  ('Carie mezială', 'cm', 6),
  ('Carie mezio-ocluzală', 'cmo', 7),
  ('Carie mezio-ocluzo-distală', 'cmod', 8),
  ('Carie ocluzală', 'co', 9),
  ('Carie ocluzo-distală', 'cod', 10),
  ('Carie palatinală', 'cp', 11),
  ('Carie radiculară distală', 'crd', 12),
  ('Carie radiculară mezială', 'crm', 13),
  ('Carie secundară distală', 'csd', 14),
  ('Carie secundară mezială', 'csm', 15),
  ('Carie secundară ocluzală', 'cso', 16),
  ('Carie secundară mezio-ocluzală', 'csmo', 17),
  ('Carie secundară ocluzo-distală', 'csod', 18),
  ('Coroană ceramică', 'ccr', 19),
  ('Coroană metalo-ceramică', 'cmc', 20),
  ('Coroană provizorie', 'cpv', 21),
  ('Dinte devital', 'dd', 22),
  ('Dinte inclus', 'di', 23),
  ('Edentat parțial', 'ep', 24),
  ('Edentat total', 'et', 25),
  ('Implant', 'imp', 26),
  ('Obturat compozit', 'oc', 27),
  ('Obturat amalgam', 'oa', 28),
  ('Obturație canal', 'obc', 29),
  ('Pivot', 'pv', 30),
  ('Proteză mobilă', 'pm', 31),
  ('Proteză fixă', 'pf', 32),
  ('Punte ceramică', 'pc', 33),
  ('Punte metalo-ceramică', 'pmc', 34),
  ('Rest radicular', 'rr', 35),
  ('Tratament endodontic', 'te', 36),
  ('Tratament endodontic incomplet', 'tei', 37),
  ('Urgență', 'urg', 38),
  ('Vinir ceramic', 'vc', 39),
  ('Vinir compozit', 'vco', 40);
