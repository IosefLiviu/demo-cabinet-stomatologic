import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Patient } from '@/hooks/usePatients';
import { CLINIC, getClinicCopyright } from '@/constants/clinic';
import { escapeHtml } from '@/lib/print-utils';

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  doctor_code?: string | null;
  is_active: boolean;
}

interface LabTestReferralProps {
  patients: Patient[];
  doctors: Doctor[];
}

// Default lab tests available for selection
const LAB_TESTS = [
  { id: 'hemoleucograma', name: 'Hemoleucograma complete' },
  { id: 'colesterol', name: 'Colesterol' },
  { id: 'glicemie', name: 'Glicemie' },
  { id: 'uree', name: 'Uree' },
  { id: 'creatinina', name: 'Creatinina' },
  { id: 'tgo_tgp', name: 'TGO, TGP, TS, TC' },
  { id: 'aghvc', name: 'AgHVC' },
  { id: 'achvc', name: 'AcHVC' },
  { id: 'trigliceride', name: 'Trigliceride' },
];

export function LabTestReferral({ patients, doctors }: LabTestReferralProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [referralDate, setReferralDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');
  
  // Selected lab tests
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [includeBetaCTx, setIncludeBetaCTx] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  const handleToggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTests.length === LAB_TESTS.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(LAB_TESTS.map(t => t.id));
    }
  };

  const handlePrint = () => {
    if (!selectedPatient || !selectedDoctor) return;

    const patientFullName = `${selectedPatient.first_name} ${selectedPatient.last_name}`;
    const patientAddress = selectedPatient.address || '';
    const patientCity = selectedPatient.city || '';
    const patientPhone = selectedPatient.phone || '';
    const patientCNP = selectedPatient.cnp || '';
    
    const formattedDate = format(new Date(referralDate), 'd MMMM yyyy', { locale: ro });

    const selectedTestNames = selectedTests
      .map(id => LAB_TESTS.find(t => t.id === id)?.name)
      .filter(Boolean);

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bilet de Trimitere Analize</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              padding: 30px 40px; 
              color: #1a1a1a; 
              font-size: 14px;
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
              margin: 30px 0;
              text-decoration: underline;
            }
            .patient-info {
              margin-bottom: 25px;
              line-height: 2;
            }
            .patient-info .line {
              border-bottom: 1px solid #333;
              min-width: 150px;
              display: inline-block;
              padding: 0 5px;
            }
            .tests-section {
              margin: 25px 0;
            }
            .tests-section h3 {
              margin-bottom: 15px;
            }
            .tests-list {
              list-style-type: disc;
              padding-left: 30px;
            }
            .tests-list li {
              margin-bottom: 8px;
              font-size: 14px;
            }
            .optional-note {
              margin-top: 30px;
              list-style-type: disc;
              padding-left: 30px;
              font-style: italic;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 20px;
            }
            .signature-block {
              text-align: left;
            }
            .signature-block .label {
              font-weight: bold;
              margin-bottom: 30px;
            }
            .doctor-stamp {
              margin-top: 40px;
              padding: 15px;
              border: 2px solid #1a365d;
              display: inline-block;
              text-align: center;
              font-family: 'Times New Roman', serif;
            }
            .doctor-stamp .name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .doctor-stamp .specialization {
              font-size: 12px;
              margin-bottom: 3px;
            }
            .doctor-stamp .code {
              font-size: 11px;
              color: #555;
            }
            .footer {
              margin-top: 60px;
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
              <img src="${CLINIC.logoPrint}" alt="Logo" class="logo" />
              <span class="clinic-name">${escapeHtml(CLINIC.shortName)}</span>
            </div>
            <div class="clinic-contact">
              <p>${escapeHtml(CLINIC.phone)}</p>
              <p>${escapeHtml(CLINIC.address)}</p>
            </div>
          </div>

          <div class="title">Bilet de trimitere</div>

          <div class="patient-info">
            <p>
              Subsemnatul(a) <span class="line">${escapeHtml(patientFullName)}</span> 
              având domiciliul/reședința în localitatea <span class="line">${escapeHtml(patientCity)}</span>,
              b-ul/str/aleea <span class="line">${escapeHtml(patientAddress)}</span>,
            </p>
            <p>
              legitimat(a) cu B.I/C.I/pașaport seria <span class="line"></span>, 
              nr <span class="line">${escapeHtml(patientCNP)}</span>, 
              tel <span class="line">${escapeHtml(patientPhone)}</span>
            </p>
          </div>

          <div class="tests-section">
            <h3>Rugăm efectuarea următoarelor analize medicale:</h3>
            <ul class="tests-list">
              ${selectedTestNames.map(name => `<li>${escapeHtml(name || '')}</li>`).join('')}
            </ul>
          </div>

          <div class="signature-section">
            <div class="signature-block">
              <div class="label">DATA: ${escapeHtml(formattedDate)}</div>
            </div>
            <div class="signature-block">
              <div class="label">SEMNĂTURA:</div>
              <div class="doctor-stamp">
                <div class="name">${escapeHtml(selectedDoctor.name)}</div>
                <div class="specialization">${escapeHtml(selectedDoctor.specialization || 'Medic Stomatolog')}</div>
                ${selectedDoctor.doctor_code ? `<div class="code">Cod: ${escapeHtml(selectedDoctor.doctor_code)}</div>` : ''}
              </div>
            </div>
          </div>

          ${includeBetaCTx ? `
            <ul class="optional-note">
              <li>Optional pentru doamne: Beta-CTx</li>
            </ul>
          ` : ''}

          <div class="footer">
            <p>${escapeHtml(CLINIC.name)} | ${escapeHtml(CLINIC.address)}</p>
            <p>Tel: ${escapeHtml(CLINIC.phone)} | Email: ${escapeHtml(CLINIC.email)} | ${escapeHtml(CLINIC.website)}</p>
            <p>${getClinicCopyright()}</p>
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
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Trimitere Analize</span>
            <Button 
              onClick={handlePrint} 
              className="gap-2" 
              disabled={!selectedPatientId || !selectedDoctorId || selectedTests.length === 0}
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

          {/* Lab Tests Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Analize solicitate</Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedTests.length === LAB_TESTS.length ? 'Deselectează tot' : 'Selectează tot'}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LAB_TESTS.map(test => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={test.id}
                    checked={selectedTests.includes(test.id)}
                    onCheckedChange={() => handleToggleTest(test.id)}
                  />
                  <Label htmlFor={test.id} className="text-sm cursor-pointer">
                    {test.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Beta-CTx */}
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="beta-ctx"
              checked={includeBetaCTx}
              onCheckedChange={(checked) => setIncludeBetaCTx(checked === true)}
            />
            <Label htmlFor="beta-ctx" className="text-sm cursor-pointer">
              Optional pentru doamne: Beta-CTx
            </Label>
          </div>

          {/* Preview of selected tests */}
          {selectedTests.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Analize selectate ({selectedTests.length}):</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {selectedTests.map(id => {
                  const test = LAB_TESTS.find(t => t.id === id);
                  return test ? <li key={id}>{test.name}</li> : null;
                })}
                {includeBetaCTx && <li className="italic">Beta-CTx (optional doamne)</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
