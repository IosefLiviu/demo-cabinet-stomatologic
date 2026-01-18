import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Plus, Trash2 } from 'lucide-react';
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
  specialization?: string | null;
}

interface PrescriptionItem {
  id: string;
  medication: string;
  quantity: string;
  dosage: string;
}

interface PrescriptionFormProps {
  patients: Patient[];
  doctors: Doctor[];
}

const PrescriptionForm = ({ patients, doctors }: PrescriptionFormProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  
  // Prescription header fields
  const [judet, setJudet] = useState('Ilfov');
  const [localitate, setLocalitate] = useState('Măgurele');
  const [unitateSanitara, setUnitateSanitara] = useState('Perfect Smile');
  const [nrFisa, setNrFisa] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    { id: crypto.randomUUID(), medication: '', quantity: '', dosage: '' }
  ]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase()) || 
           p.phone.includes(patientSearch);
  });

  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { id: crypto.randomUUID(), medication: '', quantity: '', dosage: '' }
    ]);
  };

  const removePrescriptionItem = (id: string) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
    }
  };

  const updatePrescriptionItem = (id: string, field: keyof PrescriptionItem, value: string) => {
    setPrescriptionItems(prescriptionItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const patientAge = selectedPatient?.date_of_birth ? calculateAge(selectedPatient.date_of_birth) : '';
    const patientAddress = [selectedPatient?.address, selectedPatient?.city].filter(Boolean).join(', ');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rețetă - ${selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : ''}</title>
          <style>
            @page {
              size: 100mm 210mm;
              margin: 5mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.4;
              padding: 10px;
              max-width: 95mm;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #000;
            }
            .header-title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .form-row {
              display: flex;
              margin-bottom: 6px;
              align-items: baseline;
            }
            .form-label {
              min-width: 80px;
            }
            .form-value {
              flex: 1;
              border-bottom: 1px dotted #000;
              padding-left: 5px;
              min-height: 18px;
            }
            .form-row-split {
              display: flex;
              gap: 10px;
              margin-bottom: 6px;
            }
            .form-row-split > div {
              display: flex;
              flex: 1;
              align-items: baseline;
            }
            .prescription-section {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
            }
            .prescription-item {
              margin-bottom: 10px;
              padding-left: 10px;
            }
            .prescription-number {
              font-weight: bold;
            }
            .medication-name {
              font-weight: bold;
              margin-left: 5px;
            }
            .quantity {
              margin-left: 20px;
            }
            .dosage {
              margin-left: 20px;
              font-style: italic;
            }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .date-section {
              text-align: left;
            }
            .signature-section {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 40px;
              font-size: 10pt;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">REȚETĂ MEDICALĂ</div>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Județul:</span>
              <span class="form-value">${judet}</span>
            </div>
            <div>
              <span class="form-label">Localitatea:</span>
              <span class="form-value">${localitate}</span>
            </div>
          </div>
          
          <div class="form-row">
            <span class="form-label">Unitatea sanitară:</span>
            <span class="form-value">${unitateSanitara}</span>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Numele:</span>
              <span class="form-value">${selectedPatient?.last_name || ''}</span>
            </div>
            <div>
              <span class="form-label">Prenumele:</span>
              <span class="form-value">${selectedPatient?.first_name || ''}</span>
            </div>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Sex M/F:</span>
              <span class="form-value">${selectedPatient?.gender === 'M' ? 'M' : selectedPatient?.gender === 'F' ? 'F' : ''}</span>
            </div>
            <div>
              <span class="form-label">Vârsta:</span>
              <span class="form-value">${patientAge}</span>
            </div>
          </div>
          
          <div class="form-row">
            <span class="form-label">Domiciliul:</span>
            <span class="form-value">${patientAddress}</span>
          </div>
          
          <div class="form-row">
            <span class="form-label">Nr. fișă:</span>
            <span class="form-value">${nrFisa || selectedPatient?.cnp || ''}</span>
          </div>
          
          <div class="form-row">
            <span class="form-label">Diagnostic:</span>
            <span class="form-value">${diagnostic}</span>
          </div>
          
          <div class="prescription-section">
            <strong>Rp.</strong>
            ${prescriptionItems.filter(item => item.medication).map((item, index) => `
              <div class="prescription-item">
                <span class="prescription-number">${index + 1})</span>
                <span class="medication-name">${item.medication}</span>
                ${item.quantity ? `<div class="quantity">Nr. ${item.quantity}</div>` : ''}
                ${item.dosage ? `<div class="dosage">Ds.int. ${item.dosage}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <div class="date-section">
              <strong>Data:</strong> ${format(new Date(prescriptionDate), 'dd.MM.yyyy')}
            </div>
            <div class="signature-section">
              <div class="signature-line">
                Semnătura și parafa<br/>medicului
                ${selectedDoctor ? `<div style="margin-top: 5px; font-size: 9pt;">${selectedDoctor.name}</div>` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setPatientSearch('');
    setNrFisa('');
    setDiagnostic('');
    setPrescriptionDate(format(new Date(), 'yyyy-MM-dd'));
    setPrescriptionItems([{ id: crypto.randomUUID(), medication: '', quantity: '', dosage: '' }]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Eliberare Rețetă
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient & Doctor Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pacient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Caută pacient..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Medic</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează medic" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Județul</Label>
              <Input value={judet} onChange={(e) => setJudet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Localitatea</Label>
              <Input value={localitate} onChange={(e) => setLocalitate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unitatea sanitară</Label>
              <Input value={unitateSanitara} onChange={(e) => setUnitateSanitara(e.target.value)} />
            </div>
          </div>

          {/* Patient Info (read-only from selected patient) */}
          {selectedPatient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Nume</Label>
                <p className="font-medium">{selectedPatient.last_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Prenume</Label>
                <p className="font-medium">{selectedPatient.first_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">CNP</Label>
                <p className="font-medium">{selectedPatient.cnp || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Adresă</Label>
                <p className="font-medium">
                  {[selectedPatient.address, selectedPatient.city].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
            </div>
          )}

          {/* Prescription Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nr. fișă (CNP)</Label>
              <Input 
                value={nrFisa} 
                onChange={(e) => setNrFisa(e.target.value)}
                placeholder={selectedPatient?.cnp || 'Nr. fișă sau CNP'}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={prescriptionDate} 
                onChange={(e) => setPrescriptionDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Diagnostic</Label>
              <Input 
                value={diagnostic} 
                onChange={(e) => setDiagnostic(e.target.value)}
                placeholder="Diagnostic"
              />
            </div>
          </div>

          {/* Prescription Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Medicamente (Rp.)</Label>
              <Button variant="outline" size="sm" onClick={addPrescriptionItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă medicament
              </Button>
            </div>
            
            <div className="space-y-3">
              {prescriptionItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg">
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    <Label className="text-xs">Medicament</Label>
                    <Input
                      value={item.medication}
                      onChange={(e) => updatePrescriptionItem(item.id, 'medication', e.target.value)}
                      placeholder={`${index + 1}) Denumire medicament`}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-1">
                    <Label className="text-xs">Cantitate (Nr.)</Label>
                    <Input
                      value={item.quantity}
                      onChange={(e) => updatePrescriptionItem(item.id, 'quantity', e.target.value)}
                      placeholder="ex: VI"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-4 space-y-1">
                    <Label className="text-xs">Dozaj (Ds.int.)</Label>
                    <Input
                      value={item.dosage}
                      onChange={(e) => updatePrescriptionItem(item.id, 'dosage', e.target.value)}
                      placeholder="ex: 1x1/zi"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center md:pt-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrescriptionItem(item.id)}
                      disabled={prescriptionItems.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>
              Resetează
            </Button>
            <Button onClick={handlePrint} disabled={!selectedPatientId || prescriptionItems.every(i => !i.medication)}>
              <Printer className="h-4 w-4 mr-2" />
              Printează Rețeta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden print reference */}
      <div ref={printRef} className="hidden" />
    </div>
  );
};

export default PrescriptionForm;
