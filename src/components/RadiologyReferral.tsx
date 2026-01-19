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

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface RadiologyReferralProps {
  patients: Patient[];
  doctors: Doctor[];
}

export function RadiologyReferral({ patients, doctors }: RadiologyReferralProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [referralDate, setReferralDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');
  
  // Radiology center info
  const [centerName, setCenterName] = useState<string>('Clinica Dr Smile');
  const [centerAddress, setCenterAddress] = useState<string>('Calea Dudești, Nr 202');
  const [centerPhone, setCenterPhone] = useState<string>('0722.77.07.53');
  const [centerSchedule, setCenterSchedule] = useState<string>('');
  
  // Details
  const [details, setDetails] = useState<string>('');
  const [observations, setObservations] = useState<string>('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const patientAge = selectedPatient?.date_of_birth 
    ? calculateAge(selectedPatient.date_of_birth)
    : null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Trimitere Radiologie</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              color: #000; 
              font-size: 12px;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 1px solid #999;
              padding-bottom: 10px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo {
              width: 60px;
              height: 60px;
            }
            .clinic-contact {
              text-align: right;
              font-size: 11px;
            }
            .clinic-contact p {
              margin: 2px 0;
            }
            .title { 
              text-align: center; 
              font-weight: bold; 
              font-size: 14px;
              margin: 15px 0;
              text-transform: uppercase;
            }
            .form-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .form-table td {
              border: 1px solid #333;
              padding: 8px;
              vertical-align: top;
            }
            .form-table .label {
              font-weight: bold;
            }
            .section-title {
              text-align: center;
              font-weight: bold;
              background: #f5f5f5;
              padding: 5px;
              border: 1px solid #333;
              border-bottom: none;
            }
            .section-content {
              border: 1px solid #333;
              min-height: 80px;
              padding: 10px;
            }
            .observations-content {
              min-height: 60px;
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
            <span>Trimitere Radiologie</span>
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

          {/* Radiology Center Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Centru Radiologie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nume Centru</Label>
                <Input
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="Clinica Dr Smile"
                />
              </div>
              <div className="space-y-2">
                <Label>Adresă</Label>
                <Input
                  value={centerAddress}
                  onChange={(e) => setCenterAddress(e.target.value)}
                  placeholder="Calea Dudești, Nr 202"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={centerPhone}
                  onChange={(e) => setCenterPhone(e.target.value)}
                  placeholder="0722.77.07.53"
                />
              </div>
              <div className="space-y-2">
                <Label>Program de lucru</Label>
                <Input
                  value={centerSchedule}
                  onChange={(e) => setCenterSchedule(e.target.value)}
                  placeholder="L-V: 09:00 - 18:00"
                />
              </div>
            </div>
          </div>

          {/* Details & Observations */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Detalii</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ct control - luna 08 cad IV - chirurgie..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Observații</Label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observații suplimentare..."
                rows={3}
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
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                PERFECT SMILE GLIM
              </div>
            </div>
            <div className="clinic-contact">
              <p>0721.702.820</p>
              <p>perfectsmilevarteju@gmail.com</p>
              <p>www.perfectsmileglim.ro</p>
              <p>Str. București 68-70, Varteju, Magurele</p>
            </div>
          </div>

          <div className="title">TRIMITERE RADIOLOGIE</div>

          <table className="form-table">
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <p><span className="label">Medic:</span> Dr. {selectedDoctor?.name || '-'}</p>
                  <p><span className="label">Unitate medicală:</span> PERFECT SMILE GLIM</p>
                  <p><span className="label">Email:</span> perfectsmilevarteju@gmail.com</p>
                  <p><span className="label">Telefon:</span> 0721.70.28.20</p>
                </td>
                <td style={{ width: '50%' }}>
                  <p><span className="label">Centru:</span> {centerName}</p>
                  <p><span className="label">Adresă:</span> {centerAddress}</p>
                  <p><span className="label">Telefon:</span> {centerPhone}</p>
                  <p><span className="label">Program de lucru:</span> {centerSchedule}</p>
                </td>
              </tr>
              <tr>
                <td>
                  <p><span className="label">Dată:</span> {referralDate ? format(new Date(referralDate), 'dd.MM.yyyy', { locale: ro }) : '-'}</p>
                  <p><span className="label">Pacient:</span> {selectedPatient ? `${selectedPatient.last_name} ${selectedPatient.first_name}` : '-'}</p>
                </td>
                <td>
                  <p><span className="label">Vârsta:</span> {patientAge !== null ? `${patientAge} ani` : '-'}</p>
                  <p><span className="label">Sex:</span> {selectedPatient?.gender === 'M' ? 'M' : selectedPatient?.gender === 'F' ? 'F' : '-'}</p>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-title">Detalii</div>
          <div className="section-content">
            {details || '-'}
          </div>

          <div className="section-title" style={{ marginTop: '15px' }}>Observații</div>
          <div className="section-content observations-content">
            {observations || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
