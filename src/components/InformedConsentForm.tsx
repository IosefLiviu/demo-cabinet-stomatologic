import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Patient } from '@/hooks/usePatients';
import { CLINIC } from '@/constants/clinic';
import { escapeHtml } from '@/lib/print-utils';

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface InformedConsentFormProps {
  patients: Patient[];
  doctors: Doctor[];
}

export function InformedConsentForm({ patients, doctors }: InformedConsentFormProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [consentDate, setConsentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');
  const [interventionType, setInterventionType] = useState<string>('');

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
          <title>Formular de Consimțământ Informat</title>
          <style>
            @page {
              size: A4;
              margin: 8mm 12mm;
            }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 0; 
              margin: 0;
              color: #1a365d; 
              font-size: 9px;
              line-height: 1.25;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 2px solid #b8860b;
            }
            .logo-section {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .logo {
              width: 70px;
              height: auto;
              object-fit: contain;
            }
            .clinic-contact {
              text-align: right;
              font-size: 8px;
              color: #666;
            }
            .clinic-contact p {
              margin: 0;
            }
            .legal-reference {
              font-size: 7px;
              color: #666;
              margin-bottom: 6px;
              font-style: italic;
            }
            .title {
              text-align: center;
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .subtitle {
              text-align: center;
              font-size: 8px;
              margin-bottom: 8px;
              color: #666;
            }
            .patient-info {
              margin-bottom: 6px;
              text-align: justify;
            }
            .patient-info p {
              margin: 0;
              line-height: 1.35;
            }
            .underline {
              border-bottom: 1px solid #333;
              display: inline-block;
              min-width: 80px;
              padding: 0 3px;
            }
            .underline-short {
              border-bottom: 1px solid #333;
              display: inline-block;
              min-width: 40px;
              padding: 0 2px;
            }
            .content {
              text-align: justify;
            }
            .content p {
              margin-bottom: 4px;
              text-indent: 15px;
            }
            .risks-section {
              margin: 4px 0;
            }
            .risks-section p {
              margin-bottom: 3px;
              text-indent: 15px;
            }
            .risks-list {
              margin: 3px 0 3px 20px;
              padding: 0;
              list-style-type: none;
              columns: 2;
              column-gap: 15px;
            }
            .risks-list li {
              margin-bottom: 1px;
              padding-left: 10px;
              position: relative;
              font-size: 8px;
            }
            .risks-list li:before {
              content: "-";
              position: absolute;
              left: 0;
            }
            .declarations {
              margin-top: 4px;
            }
            .declarations p {
              margin-bottom: 3px;
              text-indent: 15px;
            }
            .signature-section {
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
            }
            .signature-block {
              text-align: left;
            }
            .signature-block p {
              margin: 2px 0;
            }
            .signature-line {
              margin-top: 20px;
              border-top: 1px solid #333;
              width: 150px;
              font-size: 7px;
              text-align: center;
              padding-top: 2px;
            }
            .footer {
              margin-top: 10px;
              padding-top: 4px;
              border-top: 1px solid #b8860b;
              text-align: center;
              font-size: 7px;
              color: #666;
            }
            .footer p {
              margin: 0;
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

  const patientFullName = selectedPatient 
    ? `${selectedPatient.last_name} ${selectedPatient.first_name}` 
    : '___________________';
  
  const patientAddress = selectedPatient?.address || '___________________';
  const patientCity = selectedPatient?.city || '___________________';
  const patientCNP = selectedPatient?.cnp || '___________________';
  const patientPhone = selectedPatient?.phone || '___________________';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Formular de Consimțământ Informat</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Intervention Type */}
            <div className="space-y-2">
              <Label>Tip Intervenție (opțional)</Label>
              <Input
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
                placeholder="ex: extracție, implant, etc."
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={consentDate}
                onChange={(e) => setConsentDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview (hidden) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <div className="logo-section">
              <img src="/images/perfect-smile-logo-print.jpg" alt="Perfect Smile Logo" className="logo" />
            </div>
            <div className="clinic-contact">
              <p>{CLINIC.phone}</p>
              <p>{CLINIC.email}</p>
              <p>{CLINIC.address}</p>
            </div>
          </div>

          <p className="legal-reference">
            În temeiul art. 500 și 502 din Legea nr. 95/2006 privind reforma în domeniul sănătății, cu modificările și completările ulterioare. Anexa 1 la Decizia nr. 3 a CMDR
          </p>

          <p className="title">FORMULAR DE CONSIMȚĂMÂNT INFORMAT</p>
          <p className="subtitle">ÎN VEDEREA EFECTUĂRII TRATAMENTELOR CHIRURGICALE ÎN<br/>CABINETUL DE MEDICINĂ DENTARĂ</p>

          <div className="patient-info">
            <p>
              Subsemnatul(a) <span className="underline">{escapeHtml(patientFullName)}</span>, 
              având domiciliul/reședința situat(ă) în (localitatea) <span className="underline">{escapeHtml(patientCity)}</span>, 
              str. <span className="underline">{escapeHtml(patientAddress)}</span>, 
              legitimat(ă) cu Act (B.I./C.I./pașaport) seria <span className="underline-short">____</span> nr. <span className="underline-short">{escapeHtml(patientCNP?.substring(0, 6) || '______')}</span>, 
              tel. <span className="underline">{escapeHtml(patientPhone)}</span>, 
              în calitate de pacient/reprezentant legal al pacientului, 
              cod numeric personal (al pacientului) <span className="underline">{escapeHtml(patientCNP)}</span>, 
              autorizez și permit <strong>PERFECT SMILE GLIM</strong> (denumire cabinet de medicină dentară) și 
              <strong> Dr. {escapeHtml(selectedDoctor?.name || '___________________')}</strong> (prenume și nume medic dentist), 
              precum și colaboratorilor coordonați de acesta să realizeze următoarea intervenție chirurgicală{interventionType ? `: ${escapeHtml(interventionType)}` : ':'}
            </p>
          </div>

          <div className="content">
            <p>
              Menționez că am fost informat(ă) cu privire la natura, scopul, beneficiile și riscurile neefectuării intervenției chirurgicale și a celorlalte opțiuni terapeutice care mi-au fost explicate pe înțelesul meu, inclusiv faptul că am dreptul de a solicita și o altă opinie medicală.
            </p>

            <p>
              Mi-au prezentat și am înțeles riscurile asociate, respectiv consecințele pe care le presupune intervenția chirurgicală (anticipate sau prevăzute), cât și riscurile pe care le impun investigațiile necesare intervenției chirurgicale mai sus-menționată.
            </p>

            <p>
              Înțeleg și că toate procedurile specifice intervenției chirurgicale și cele corespunzătoare investigațiilor asociate pot implica și riscuri imprevizibile (inclusiv riscul de deces).
            </p>

            <div className="risks-section">
              <p>
                Totodată, mi s-a explicat și am înțeles că toate procedurile de chirurgie efectuate în cabinetul de medicină dentară presupun o serie de riscuri, unele inevitabile:
              </p>
              <ul className="risks-list">
                <li>reacții alergice/toxice la medicamente și substanțe anestezice pre-, intra- și postoperator;</li>
                <li>hemoragie intra- și postoperatorie;</li>
                <li>hematoame, echimoze, edeme postoperatorii;</li>
                <li>dureri în teritoriul oro-maxilo-facial;</li>
                <li>dehiscența plăgilor;</li>
                <li>lezarea dinților învecinați;</li>
                <li>hipoestezia/anestezia nervului alveolar inferior, mentonier, lingual, infraorbitar;</li>
                <li>infecții ale spațiilor fasciale cervico-faciale;</li>
                <li>osteita/osteomielita oaselor maxilare;</li>
                <li>sinuzite maxilare;</li>
                <li>comunicare oro-sinuzală sau oro-nazală;</li>
                <li>fracturi ale oaselor maxilare;</li>
                <li>accidente prin ruperea instrumentarului în timpul manevrelor chirurgicale;</li>
                <li>escoriații, plăgi, ulcerații produse prin contactul mucoaselor cu instrumentarul chirurgical sau cu substanțe medicamentoase.</li>
              </ul>
            </div>

            <p>
              De asemenea, înțeleg necesitatea consultului interdisciplinar însoțit de avizul de specialitate pentru efectuarea intervenției chirurgicale.
            </p>

            <div className="declarations">
              <p>
                Declar că sunt conștient(ă) de aceste riscuri. Cu urmare, accept fără a solicita ulterior daune materiale sau morale medicului dentist cauzat de complicațiile ce pot surveni în urma tratamentului necesar.
              </p>

              <p>
                Dacă în cursul intervenției chirurgicale asupra mea sau a persoanei intervenții neapărat necesare, care nu au fost prevăzute până la această dată sau care se datorează unor cauze imposibil de prevăzut la acest moment, autorizez și declar că nu am pretenții față de medic sau de angajatorul său.
              </p>

              <p>
                Înțeleg sensul procedurii chirurgicale constând în administrarea anesteziei loco-regionale, fiind informat(ă) pe deplin de riscurile pe care le presupune administrarea substanțelor anestezice în contextul cu starea generală, fiind conștient(ă) de acceptarea lor și în condițiile practicate într-luni de zile și în consecință de cauză consimțământul pentru intervenția chirurgicală prezentată.
              </p>

              <p>
                În conformitate cu art. 19 și 20 din Legea nr. 46/2003 privind drepturile pacientului, îmi/nu îmi exprim acordul de a participa în calitate de pacient la învățământul medical clinic și la cercetarea științifică, și cu privire la fotografiere/filmare, din pre-, intra- și post-operator, toate aceste informații putând fi folosite în scop didactic, medical, științific. Înțeleg că în timpul realizării intervenției chirurgicale/investigației pot fi asistat(ă) mai și de alte persoane autorizate, în scop educativ mai sus arătate, și consimt/nu consimt la prezența acestora.
              </p>

              <p>
                <strong>Certific că am citit, am înțeles și accept pe deplin cele de mai sus și că în urmare semnez prezentul consimțământ informat.</strong>
              </p>
            </div>
          </div>

          <div className="signature-section">
            <div className="signature-block">
              <p><strong>Data:</strong> {consentDate ? format(new Date(consentDate), 'dd.MM.yyyy', { locale: ro }) : '____________'}</p>
              <div className="signature-line">
                (semnătura pacientului/reprezentantului legal)
              </div>
            </div>
          </div>

          <div className="footer">
            <p><strong>{CLINIC.name}</strong> | {CLINIC.address}</p>
            <p>Tel: {CLINIC.phone} | Email: {CLINIC.email} | {CLINIC.website}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
