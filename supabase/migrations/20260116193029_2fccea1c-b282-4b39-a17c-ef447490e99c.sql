-- Add new columns for decont and co_plata
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS decont numeric DEFAULT NULL;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS co_plata numeric DEFAULT NULL;

-- Clear existing treatments and insert new ones
DELETE FROM public.treatments;

-- Insert all treatments from the price list
INSERT INTO public.treatments (name, category, default_price, decont, co_plata, default_duration, is_active) VALUES
-- CONSULTAȚII ȘI EXAMINĂRI
('Consultație stomatologică completă cu plan de tratament', 'Consultații și Examinări', 100, 0, 100, 30, true),
('Consultație de urgență', 'Consultații și Examinări', 150, 0, 150, 20, true),
('Examinare parodontală completă', 'Consultații și Examinări', 100, 0, 100, 30, true),

-- RADIOLOGIE DENTARĂ
('Radiografie retroalveolară', 'Radiologie Dentară', 30, 9, 21, 10, true),
('Radiografie panoramică (OPG)', 'Radiologie Dentară', 80, 32, 48, 15, true),
('Radiografie CBCT – o arcadă', 'Radiologie Dentară', 200, 0, 200, 20, true),
('Radiografie CBCT – ambele arcade', 'Radiologie Dentară', 350, 0, 350, 25, true),

-- IGIENĂ ȘI PROFILAXIE DENTARĂ
('Detartraj supragingival și subgingival', 'Igienă și Profilaxie', 250, 0, 250, 45, true),
('Periaj profesional și aplicare de fluor', 'Igienă și Profilaxie', 100, 0, 100, 20, true),
('Sigilare dentară (pe dinte)', 'Igienă și Profilaxie', 100, 0, 100, 15, true),

-- TRATAMENTE RESTAURATIVE – OBTURAȚII
('Obturație compozit simplă (o suprafață)', 'Tratamente Restaurative', 150, 31, 119, 30, true),
('Obturație compozit medie (două suprafețe)', 'Tratamente Restaurative', 200, 31, 169, 40, true),
('Obturație compozit complexă (trei+ suprafețe)', 'Tratamente Restaurative', 250, 31, 219, 50, true),
('Obturație estetică frontală', 'Tratamente Restaurative', 200, 31, 169, 40, true),
('Reconstrucție coronară cu pivot fibră de sticlă', 'Tratamente Restaurative', 350, 31, 319, 60, true),

-- ENDODONȚIE (TRATAMENT DE CANAL)
('Tratament de canal – monoradicular (incisiv/canin)', 'Endodonție', 400, 72, 328, 60, true),
('Tratament de canal – premolar (2 canale)', 'Endodonție', 500, 72, 428, 75, true),
('Tratament de canal – molar (3–4 canale)', 'Endodonție', 700, 72, 628, 90, true),
('Retratament de canal', 'Endodonție', 800, 0, 800, 90, true),
('Extirpare pulpară de urgență', 'Endodonție', 150, 0, 150, 30, true),
('Aplicare medicație intracanalară (hidroxid de calciu)', 'Endodonție', 50, 0, 50, 15, true),

-- PARODONTOLOGIE
('Chiuretaj parodontal pe sextant', 'Parodontologie', 300, 0, 300, 45, true),
('Chiuretaj parodontal pe arcadă', 'Parodontologie', 500, 0, 500, 60, true),
('Tratament laser parodontal (pe sextant)', 'Parodontologie', 400, 0, 400, 45, true),
('Gingivectomie/Gingivoplastie (pe dinte)', 'Parodontologie', 200, 0, 200, 30, true),
('Adiție de os (pe sextant)', 'Parodontologie', 800, 0, 800, 60, true),
('Imobilizare dinți mobili (per dinte)', 'Parodontologie', 150, 0, 150, 20, true),

-- CHIRURGIE DENTARĂ
('Extracție dinte temporar', 'Chirurgie Dentară', 100, 19, 81, 20, true),
('Extracție dinte permanent simplu', 'Chirurgie Dentară', 150, 40, 110, 30, true),
('Extracție dinte permanent cu complicații', 'Chirurgie Dentară', 250, 40, 210, 45, true),
('Extracție rest radicular', 'Chirurgie Dentară', 200, 40, 160, 30, true),
('Extracție molar de minte erupt simplu', 'Chirurgie Dentară', 300, 40, 260, 45, true),
('Extracție molar de minte inclus parțial', 'Chirurgie Dentară', 500, 0, 500, 60, true),
('Extracție molar de minte inclus total (osteotomie)', 'Chirurgie Dentară', 700, 0, 700, 75, true),
('Chiuretaj alveolar post-extractional', 'Chirurgie Dentară', 100, 0, 100, 15, true),
('Suturare plagă (per sutură)', 'Chirurgie Dentară', 50, 0, 50, 10, true),
('Frenectomie/Frenuloplastie', 'Chirurgie Dentară', 350, 0, 350, 45, true),
('Excizie mucoasă/leziune benignă', 'Chirurgie Dentară', 400, 0, 400, 45, true),
('Drenaj abces dentar', 'Chirurgie Dentară', 200, 0, 200, 30, true),

-- PROTETICĂ DENTARĂ FIXĂ
('Coroană metalică', 'Protetică Fixă', 600, 203, 397, 45, true),
('Coroană metalo-ceramică', 'Protetică Fixă', 800, 203, 597, 45, true),
('Coroană ceramică integrală (zirconiu)', 'Protetică Fixă', 1200, 203, 997, 60, true),
('Coroană ceramică presată (e.max)', 'Protetică Fixă', 1200, 203, 997, 60, true),
('Fațetă dentară ceramică', 'Protetică Fixă', 1000, 0, 1000, 45, true),
('Inlay/Onlay ceramică', 'Protetică Fixă', 900, 0, 900, 60, true),
('Element de punte metalo-ceramică', 'Protetică Fixă', 700, 203, 497, 45, true),
('Element de punte zirconiu', 'Protetică Fixă', 1100, 203, 897, 45, true),
('Coroană provizorie acrilat', 'Protetică Fixă', 150, 0, 150, 30, true),
('Recimentare coroană', 'Protetică Fixă', 100, 0, 100, 20, true),
('Dezafectare coroană', 'Protetică Fixă', 100, 0, 100, 20, true),

-- PROTETICĂ DENTARĂ MOBILĂ
('Proteză totală acrilat (pe arcadă)', 'Protetică Mobilă', 1200, 203, 997, 60, true),
('Proteză totală flexibilă (pe arcadă)', 'Protetică Mobilă', 1500, 0, 1500, 60, true),
('Proteză parțială acrilat (1–5 dinți)', 'Protetică Mobilă', 600, 203, 397, 45, true),
('Proteză parțială scheletată', 'Protetică Mobilă', 1500, 203, 1297, 60, true),
('Croșeu sau element adițional proteză', 'Protetică Mobilă', 150, 0, 150, 20, true),
('Căptușire proteză (rebazare)', 'Protetică Mobilă', 300, 0, 300, 30, true),
('Reparație proteză simplă', 'Protetică Mobilă', 150, 0, 150, 30, true),
('Reparație proteză complexă', 'Protetică Mobilă', 250, 0, 250, 45, true),
('Adăugare dinte la proteză', 'Protetică Mobilă', 150, 0, 150, 30, true),

-- IMPLANTOLOGIE
('Implant dentar standard (include bont de vindecare)', 'Implantologie', 3500, 0, 3500, 90, true),
('Implant dentar premium (Straumann, Nobel)', 'Implantologie', 4500, 0, 4500, 90, true),
('Bont protetic (abutment) personalizat', 'Implantologie', 800, 0, 800, 30, true),
('Coroană pe implant metalo-ceramică', 'Implantologie', 1000, 0, 1000, 45, true),
('Coroană pe implant zirconiu', 'Implantologie', 1400, 0, 1400, 45, true),
('Adiție de os (material sintetic/autogen)', 'Implantologie', 1000, 0, 1000, 60, true),
('Sinus lift (ridicare de sinus)', 'Implantologie', 2500, 0, 2500, 90, true),
('Membrană colagen pentru regenerare', 'Implantologie', 600, 0, 600, 30, true),

-- ORTODONȚIE (LA CERERE – COLABORARE)
('Consultație ortodontică + plan digital', 'Ortodonție', 250, 0, 250, 45, true),
('Aparat dentar metalic (per arcadă)', 'Ortodonție', 2500, 0, 2500, 60, true),
('Aparat dentar ceramic/safir (per arcadă)', 'Ortodonție', 3500, 0, 3500, 60, true),
('Gutiere transparente (set complet)', 'Ortodonție', 6000, 0, 6000, 60, true),
('Contenție fixă (per arcadă)', 'Ortodonție', 400, 0, 400, 30, true),
('Control lunar ortodontic', 'Ortodonție', 150, 0, 150, 20, true),

-- ALBIRE DENTARĂ
('Albire profesională în cabinet (ambele arcade)', 'Albire Dentară', 800, 0, 800, 90, true),
('Kit albire la domiciliu (gutiere personalizate)', 'Albire Dentară', 500, 0, 500, 30, true),
('Albire internă (dinte devitalizat)', 'Albire Dentară', 200, 0, 200, 30, true),

-- STOMATOLOGIE PEDIATRICĂ
('Consultație pediatrică', 'Stomatologie Pediatrică', 80, 0, 80, 20, true),
('Obturație dinte temporar', 'Stomatologie Pediatrică', 100, 31, 69, 30, true),
('Pulpotomie dinte temporar', 'Stomatologie Pediatrică', 150, 0, 150, 30, true),
('Menținător de spațiu', 'Stomatologie Pediatrică', 400, 0, 400, 45, true),
('Sigilare dinte temporar', 'Stomatologie Pediatrică', 80, 0, 80, 15, true),

-- TRATAMENTE DE URGENȚĂ
('Consultație de urgență (în afara programului)', 'Tratamente de Urgență', 200, 0, 200, 30, true),
('Tratament durere acută (temporar)', 'Tratamente de Urgență', 100, 0, 100, 20, true),
('Recimentare urgentă', 'Tratamente de Urgență', 80, 0, 80, 15, true),
('Îndepărtare corp străin', 'Tratamente de Urgență', 150, 0, 150, 30, true),

-- SERVICII SUPLIMENTARE
('Anestezie locală', 'Servicii Suplimentare', 30, 8, 22, 5, true),
('Sedare inhalatorie (protoxid de azot)', 'Servicii Suplimentare', 200, 0, 200, 30, true),
('Gutieră de bruxism', 'Servicii Suplimentare', 400, 0, 400, 30, true),
('Gutieră de protecție sport', 'Servicii Suplimentare', 350, 0, 350, 30, true),
('Certificat medical dentar', 'Servicii Suplimentare', 50, 0, 50, 15, true),
('Planificare digitală zâmbet (Digital Smile Design)', 'Servicii Suplimentare', 300, 0, 300, 45, true);