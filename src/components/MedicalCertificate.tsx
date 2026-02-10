import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Patient } from '@/hooks/usePatients';
import { CLINIC, getLogoPrintUrl, getClinicCopyright } from '@/constants/clinic';
import { escapeHtml } from '@/lib/print-utils';

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface MedicalCertificateProps {
  patients: Patient[];
  doctors: Doctor[];
}

export function MedicalCertificate({ patients, doctors }: MedicalCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [certificateDate, setCertificateDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [useDiacritics, setUseDiacritics] = useState(true);

  // Form fields
  const [judet, setJudet] = useState('Ilfov');
  const [localitate, setLocalitate] = useState('');
  const [strada, setStrada] = useState('');
  const [numar, setNumar] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('Se recomandă: repaus la domiciliu pe perioada evoluției procesului inflamatoriu, tratamentul medicamentos conform prescripției medicale');
  const [purpose, setPurpose] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  const getPatientAge = (patient: Patient): string => {
    if (!patient.date_of_birth) return '____';
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const formatDateRomanian = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, 'yyyy MMMM dd', { locale: ro });
  };

  const removeDiacritics = (text: string): string => {
    if (useDiacritics) return text;
    return text
      .replace(/ă/g, 'a').replace(/Ă/g, 'A')
      .replace(/â/g, 'a').replace(/Â/g, 'A')
      .replace(/î/g, 'i').replace(/Î/g, 'I')
      .replace(/ș/g, 's').replace(/Ș/g, 'S')
      .replace(/ț/g, 't').replace(/Ț/g, 'T');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const patientName = selectedPatient 
      ? `${selectedPatient.last_name} ${selectedPatient.first_name}` 
      : '________________';
    const patientAge = selectedPatient ? getPatientAge(selectedPatient) : '____';
    const patientAddress = strada || selectedPatient?.address || '';
    const patientCity = localitate || selectedPatient?.city || '';
    const patientJudet = judet;
    const patientNr = numar;

    const t = (text: string) => removeDiacritics(text);

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('Adeverință Medicală')}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px 40px; 
              color: #1a365d; 
              font-size: 13px;
              line-height: 1.6;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 3px solid #b8860b;
            }
            .logo-section {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .logo {
              width: 120px;
              height: auto;
              object-fit: contain;
              margin-bottom: 5px;
            }
            .clinic-name {
              font-weight: bold;
              font-size: 16px;
              color: #b8860b;
            }
            .clinic-contact {
              text-align: right;
              font-size: 11px;
              color: #666;
            }
            .clinic-contact p {
              margin: 2px 0;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 25px 0 5px 0;
              letter-spacing: 2px;
              color: #1a365d;
            }
            .date-center {
              text-align: center;
              margin-bottom: 25px;
              font-size: 13px;
              color: #666;
            }
            .field-line {
              border-bottom: 1px solid #1a365d;
              display: inline;
              padding: 0 5px;
              min-width: 80px;
              font-weight: bold;
              color: #1a365d;
            }
            .content {
              margin: 20px 0;
            }
            .content p {
              margin-bottom: 12px;
              text-align: justify;
            }
            .signature-area {
              margin-top: 50px;
              text-align: right;
              font-size: 13px;
              font-weight: bold;
            }
            .date-footer {
              margin-top: 30px;
            }
            .date-footer p {
              margin: 3px 0;
            }
            .doctor-info {
              margin-top: 40px;
            }
            .doctor-info p {
              margin: 3px 0;
            }
            .footer {
              margin-top: 50px;
              padding-top: 15px;
              border-top: 2px solid #b8860b;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
            .footer p {
              margin: 2px 0;
            }
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${showLogo ? `<img src="${getLogoPrintUrl()}" alt="Logo" class="logo" />` : ''}
              <div class="clinic-name">${CLINIC.shortName}</div>
            </div>
            <div class="clinic-contact">
              <p>${CLINIC.phone}</p>
              <p>${CLINIC.address}</p>
            </div>
          </div>
          
          <div class="title">${t('ADEVERINȚĂ MEDICALĂ')}</div>
          <div class="date-center">${formatDateRomanian(certificateDate)}</div>
          
          <div class="content">
            <p>
              ${t('Se adeverește că')}: 
              <span class="field-line">${escapeHtml(patientName)}</span>
              ${t('în vârstă de')} 
              <span class="field-line">${patientAge}</span> 
              ${t('ani')}, ${t('domiciliat în')}: ${t('Județul')} 
              <span class="field-line">${escapeHtml(patientJudet) || '________'}</span>
            </p>
            <p>
              ${t('Localitatea')} <span class="field-line">${escapeHtml(patientCity) || '________________'}</span>
              ${t('Strada')} <span class="field-line">${escapeHtml(patientAddress) || '________________'}</span>
            </p>
            <p>
              Nr. <span class="field-line">${escapeHtml(patientNr) || '______'}</span>, ${t('Având ocupația de')} 
              <span class="field-line">${escapeHtml(occupation) || '________________'}</span>
              La <span class="field-line">${escapeHtml(workplace) || '________________'}</span>
            </p>
            <p>
              ${t('Este suferind de')}: ${escapeHtml(t(diagnosis)) || '________________________________________________'}
            </p>
            <p>
              ${escapeHtml(t(recommendation))}
            </p>
            ${purpose ? `<p>${t('S-a eliberat prezenta pentru a-i servi la')}: ${escapeHtml(t(purpose))}</p>` : ''}
          </div>
          
          <div class="signature-area">
            ${t('Semnătura și parafa')}
          </div>
          
          <div class="doctor-info">
            <p><strong>${selectedDoctor ? escapeHtml(selectedDoctor.name) : '___________________'}</strong></p>
          </div>

          <div class="date-footer">
            <p>${t('Data eliberării')}: ${format(new Date(certificateDate), 'dd.MM.yyyy')}</p>
          </div>

          <div class="footer">
            <p><strong>${CLINIC.name}</strong> | ${CLINIC.address}</p>
            <p>Tel: ${CLINIC.phone} | Email: ${CLINIC.email} | ${CLINIC.website}</p>
            <p style="margin-top: 5px; font-size: 8px; color: #999;">${getClinicCopyright()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Adeverință Medicală</span>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Printează
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-logo-cert"
                checked={showLogo}
                onCheckedChange={(v) => setShowLogo(!!v)}
              />
              <Label htmlFor="show-logo-cert">Imprimă logo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-diacritics-cert"
                checked={useDiacritics}
                onCheckedChange={(v) => setUseDiacritics(!!v)}
              />
              <Label htmlFor="use-diacritics-cert">Cu diacritice</Label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Patient selector */}
            <div className="space-y-2">
              <Label>Pacient</Label>
              <Select value={selectedPatientId} onValueChange={(id) => {
                setSelectedPatientId(id);
                const p = patients.find(pt => pt.id === id);
                if (p) {
                  setLocalitate(p.city || '');
                  setStrada(p.address || '');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Caută pacient..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-8"
                    />
                  </div>
                  {filteredPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.last_name} {p.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor selector */}
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează doctor" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Data eliberării</Label>
              <Input
                type="date"
                value={certificateDate}
                onChange={(e) => setCertificateDate(e.target.value)}
              />
            </div>

            {/* Județul */}
            <div className="space-y-2">
              <Label>Județul</Label>
              <Input
                value={judet}
                onChange={(e) => setJudet(e.target.value)}
                placeholder="ex: Ilfov"
              />
            </div>

            {/* Localitatea */}
            <div className="space-y-2">
              <Label>Localitatea</Label>
              <Input
                value={localitate}
                onChange={(e) => setLocalitate(e.target.value)}
                placeholder="ex: Măgurele"
              />
            </div>

            {/* Strada */}
            <div className="space-y-2">
              <Label>Strada</Label>
              <Input
                value={strada}
                onChange={(e) => setStrada(e.target.value)}
                placeholder="ex: Str. București 68-70"
              />
            </div>

            {/* Nr. */}
            <div className="space-y-2">
              <Label>Nr.</Label>
              <Input
                value={numar}
                onChange={(e) => setNumar(e.target.value)}
                placeholder="ex: 10"
              />
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <Label>Ocupația</Label>
              <Input
                placeholder="ex: elev, student, angajat..."
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>

            {/* La (workplace) */}
            <div className="space-y-2">
              <Label>La (locul de muncă/studiu)</Label>
              <Input
                placeholder="ex: Liceul &quot;Horia Hulubei&quot;"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label>Diagnostic (Este suferind de)</Label>
            <Textarea
              placeholder="ex: Abces palatin acut odontogen, cu simptomatologie algică și inflamatorie"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
            />
          </div>

          {/* Recommendation */}
          <div className="space-y-2">
            <Label>Recomandare</Label>
            <Textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={3}
            />
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label>Scopul eliberării (opțional)</Label>
            <Textarea
              placeholder="ex: Liceul teoretic &quot;HORIA HULUBEI&quot; clasa XII - C"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
