import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Patient } from '@/hooks/usePatients';
import { CLINIC, getClinicCopyright, getLogoPrintUrl } from '@/constants/clinic';
import { escapeHtml } from '@/lib/print-utils';

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface SpecialistReferralProps {
  patients: Patient[];
  doctors: Doctor[];
}

export function SpecialistReferral({ patients, doctors }: SpecialistReferralProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [referralDate, setReferralDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');
  
  // Intervention details
  const [interventionType, setInterventionType] = useState<string>('extractii, chirurgie, implant, etc');
  const [anesthetic, setAnesthetic] = useState<string>('Articaină 4% cu epinefrină 1:100.000');
  const [alternativeAnesthetic, setAlternativeAnesthetic] = useState<string>('Lidocaină 2% fără vasoconstrictor');
  const [antibiotic, setAntibiotic] = useState<string>('Augmentin');
  const [antiInflammatory, setAntiInflammatory] = useState<string>('Ketonal');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Trimitere Medic Specialist</title>
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
            .salutation {
              font-style: italic;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .content {
              text-align: justify;
            }
            .content p {
              margin-bottom: 15px;
            }
            .patient-name {
              font-weight: bold;
              text-decoration: underline;
            }
            .medication-list {
              margin: 10px 0;
              padding-left: 20px;
            }
            .medication-list li {
              margin-bottom: 5px;
            }
            .questions-section {
              margin: 20px 0;
            }
            .questions-section p {
              margin-bottom: 10px;
            }
            .sub-list {
              margin-left: 30px;
              list-style-type: circle;
            }
            .sub-list li {
              margin-bottom: 3px;
            }
            .closing {
              margin-top: 30px;
            }
            .signature {
              margin-top: 40px;
              text-align: left;
            }
            .signature p {
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
          ${printContent.innerHTML}
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
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Trimitere Medic Specialist</span>
            <Button 
              onClick={handlePrint} 
              className="gap-2" 
              disabled={!selectedPatientId || !selectedDoctorId}
            >
              <Printer className="h-4 w-4" />
              Printează
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Pacient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Caută pacient..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredPatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Medic</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează medic" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={referralDate}
                onChange={(e) => setReferralDate(e.target.value)}
              />
            </div>
          </div>

          {/* Intervention Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Detalii Intervenție</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tip Intervenție</Label>
                <Input
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value)}
                  placeholder="extractii, chirurgie, implant, etc"
                />
              </div>
              <div className="space-y-2">
                <Label>Anestezic Principal</Label>
                <Input
                  value={anesthetic}
                  onChange={(e) => setAnesthetic(e.target.value)}
                  placeholder="Articaină 4% cu epinefrină 1:100.000"
                />
              </div>
              <div className="space-y-2">
                <Label>Anestezic Alternativ</Label>
                <Input
                  value={alternativeAnesthetic}
                  onChange={(e) => setAlternativeAnesthetic(e.target.value)}
                  placeholder="Lidocaină 2% fără vasoconstrictor"
                />
              </div>
              <div className="space-y-2">
                <Label>Antibiotic</Label>
                <Input
                  value={antibiotic}
                  onChange={(e) => setAntibiotic(e.target.value)}
                  placeholder="Augmentin"
                />
              </div>
              <div className="space-y-2">
                <Label>Antiinflamator</Label>
                <Input
                  value={antiInflammatory}
                  onChange={(e) => setAntiInflammatory(e.target.value)}
                  placeholder="Ketonal"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview (hidden) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <div className="logo-section">
              <img src={getLogoPrintUrl()} alt="Perfect Smile Logo" className="logo" />
              <div className="clinic-name">{CLINIC.shortName}</div>
            </div>
            <div className="clinic-contact">
              <p>0721.702.820</p>
              <p>Strada București 68-70</p>
            </div>
          </div>

          <p className="salutation">Stimate Domnule / Stimată Doamnă Doctor,</p>

          <div className="content">
            <p>
              Subsemnatul(a) <span className="patient-name">{selectedPatient ? `${escapeHtml(selectedPatient.last_name)} ${escapeHtml(selectedPatient.first_name)}` : '___________________'}</span> necesită intervenții stomatologice ({escapeHtml(interventionType)})
            </p>

            <p>
              Pentru intervenția planificată (ex. extracție dentară), protocolul uzual în cabinetul nostru presupune utilizarea anestezicului local:
            </p>

            <ul className="medication-list">
              <li>[Ex.: {escapeHtml(anesthetic)}] sau, la nevoie, [alternativ: {escapeHtml(alternativeAnesthetic)}].</li>
              <li>Menționăm că în protocolul terapeutic al cabinetului se utilizează <strong>{escapeHtml(antibiotic)}</strong> ca antibiotic și <strong>{escapeHtml(antiInflammatory)}</strong> ca antiinflamator. Solicităm confirmarea toleranței pacientului la aceste medicamente.</li>
            </ul>

            <div className="questions-section">
              <p><strong>Vă rugăm să ne comunicați:</strong></p>
              <p>1. Dacă există contraindicații privind utilizarea acestui tip de anestezie locală (cu sau fără adrenalină) în cazul pacientului.</p>
              <p>2. În situația în care anestezicul utilizat nu este recomandat, vă rugăm să precizați ce tip de anestezie locală este indicată.</p>
              <p>3. Dacă este necesară modificarea sau întreruperea tratamentului anticoagulant / antiagregant / antihipertensiv / alt tratament al pacientului înaintea procedurii, vă rugăm să specificați:</p>
              <ul className="sub-list">
                <li>dacă se întrerupe,</li>
                <li>cu câte zile înainte,</li>
                <li>și când se poate relua după intervenție.</li>
              </ul>
            </div>

            <p>
              Intervenția stomatologică propusă este una de durată scurtă și cu sângerare controlată, efectuată în condiții standard de siguranță.
            </p>

            <p className="closing">
              Vă mulțumim anticipat pentru colaborare și pentru sprijinul acordat în asigurarea unui tratament sigur și adaptat pacientului comun.
            </p>
          </div>

          <div className="signature">
            <p>Cu stimă,</p>
            <p style={{ marginTop: '20px' }}><strong>Dr. {escapeHtml(selectedDoctor?.name) || '___________________'}</strong></p>
            <p style={{ fontSize: '11px', color: '#666' }}>Data: {referralDate ? format(new Date(referralDate), 'dd.MM.yyyy', { locale: ro }) : '-'}</p>
          </div>

          <div className="footer">
            <p><strong>{CLINIC.name}</strong> | {CLINIC.address}</p>
            <p>Tel: {CLINIC.phone} | Email: {CLINIC.email} | {CLINIC.website}</p>
            <p style={{ marginTop: '5px', fontSize: '8px', color: '#999' }}>{getClinicCopyright()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
