import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Search } from 'lucide-react';
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
import { CLINIC, getLogoPrintUrl } from '@/constants/clinic';
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
  const [occupation, setOccupation] = useState('');
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
    const patientAddress = selectedPatient?.address || '';
    const patientCity = selectedPatient?.city || '';

    const t = (text: string) => removeDiacritics(text);

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('Adeverință Medicală')}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 40px 50px; 
              color: #000; 
              font-size: 14px;
              line-height: 1.8;
            }
            .logo-section {
              text-align: center;
              margin-bottom: 10px;
            }
            .logo {
              width: 100px;
              height: auto;
            }
            .title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin: 20px 0 5px 0;
              letter-spacing: 2px;
            }
            .date-center {
              text-align: center;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .field-line {
              border-bottom: 1px solid #000;
              display: inline;
              padding: 0 5px;
              min-width: 100px;
              font-weight: bold;
            }
            .content {
              margin: 20px 0;
            }
            .content p {
              margin-bottom: 12px;
              text-align: justify;
            }
            .signature-area {
              margin-top: 60px;
              text-align: right;
              font-size: 14px;
            }
            .date-footer {
              margin-top: 40px;
            }
            .date-footer p {
              margin: 3px 0;
            }
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            }
          </style>
        </head>
        <body>
          ${showLogo ? `<div class="logo-section"><img src="${getLogoPrintUrl()}" class="logo" /></div>` : ''}
          
          <div class="title">${t('ADEVERINȚĂ MEDICALĂ')}</div>
          <div class="date-center">${formatDateRomanian(certificateDate)}</div>
          
          <div class="content">
            <p>
              ${t('Se adeverește că')}: 
              <span class="field-line">${escapeHtml(patientName)}</span>
              ${t('în vârstă de')} 
              <span class="field-line">${patientAge}</span> 
              ${t('ani')}, ${t('domiciliat în')}: ${t('Județul')} 
              <span class="field-line">${escapeHtml(patientCity) || '________'}</span>
            </p>
            <p>
              ${t('Localitatea')} <span class="field-line">${escapeHtml(patientCity) || '________________'}</span>
              ${t('Strada')} <span class="field-line">${escapeHtml(patientAddress) || '________________'}</span>
            </p>
            <p>
              Nr. <span class="field-line">${'______'}</span>, ${t('Având ocupația de')} 
              <span class="field-line">${escapeHtml(occupation) || '________________'}</span>
              La <span class="field-line">${'________________'}</span>
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
          
          <div class="date-footer">
            <p>${t('Data eliberării')}:</p>
            <p>${formatDateRomanian(certificateDate)}</p>
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

          <div className="grid gap-4 md:grid-cols-2">
            {/* Patient selector */}
            <div className="space-y-2">
              <Label>Pacient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută pacient..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacient" />
                </SelectTrigger>
                <SelectContent>
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

            {/* Occupation */}
            <div className="space-y-2">
              <Label>Ocupația</Label>
              <Input
                placeholder="ex: elev, student, angajat..."
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
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
