import React, { useRef, useState, useEffect } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Search, User, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/hooks/usePatients';

interface Doctor {
  id: string;
  name: string;
  specialization?: string | null;
}

interface TreatmentRecord {
  id: string;
  treatment_name: string;
  tooth_numbers: number[] | null;
  price: number | null;
  performed_at: string;
  treatment_id: string | null;
  appointment_id: string | null;
  treatments?: {
    category: string | null;
  } | null;
  appointments?: {
    doctor_id: string | null;
    doctors?: {
      name: string;
    } | null;
  } | null;
}

interface EditableTreatmentRecord extends TreatmentRecord {
  editedPrice: number | null;
}

interface PatientInformationProps {
  patients: Patient[];
  doctors: Doctor[];
}

export function PatientInformation({ patients, doctors }: PatientInformationProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [treatmentRecords, setTreatmentRecords] = useState<EditableTreatmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Fetch treatment records for selected patient and date
  useEffect(() => {
    const fetchTreatmentRecords = async () => {
      if (!selectedPatientId) {
        setTreatmentRecords([]);
        return;
      }

      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('treatment_records')
          .select(`
            id,
            treatment_name,
            tooth_numbers,
            price,
            performed_at,
            treatment_id,
            appointment_id,
            treatments (
              category
            ),
            appointments (
              doctor_id,
              doctors (
                name
              )
            )
          `)
          .eq('patient_id', selectedPatientId)
          .gte('performed_at', `${dateStr}T00:00:00`)
          .lte('performed_at', `${dateStr}T23:59:59`)
          .order('performed_at', { ascending: false });

        if (error) throw error;
        // Add editedPrice field to each record
        const recordsWithEditedPrice = (data || []).map(record => ({
          ...record,
          editedPrice: record.price
        }));
        setTreatmentRecords(recordsWithEditedPrice as EditableTreatmentRecord[]);
      } catch (error) {
        console.error('Error fetching treatment records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTreatmentRecords();
  }, [selectedPatientId, selectedDate]);

  // Handle price change
  const handlePriceChange = (recordId: string, newPrice: number) => {
    setTreatmentRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, editedPrice: newPrice }
          : record
      )
    );
  };

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch)
  );

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Informare Pacient</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 11px;
                line-height: 1.3;
                margin: 0;
                padding: 15px;
                color: #1a365d;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
                border-bottom: 1px solid #d4a574;
                padding-bottom: 10px;
              }
              .logo-section {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
              }
              .logo {
                width: 120px;
                height: 80px;
                object-fit: contain;
                width: auto;
              }
              .clinic-contact {
                text-align: right;
                font-size: 10px;
                color: #c4a574;
              }
              .patient-info-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 20px 0;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
              }
              .patient-name {
                font-size: 16px;
                font-weight: bold;
                color: #1a365d;
              }
              .patient-details-left {
                display: flex;
                gap: 30px;
                font-size: 10px;
              }
              .patient-details-right {
                text-align: right;
                font-size: 10px;
              }
              .section-title {
                font-size: 13px;
                font-weight: bold;
                text-align: center;
                margin: 15px 0;
                color: #1a365d;
              }
              .date-label {
                text-align: center;
                font-size: 10px;
                margin-bottom: 10px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 10px;
              }
              th {
                background-color: #f8f4ef;
                padding: 8px 5px;
                text-align: left;
                font-weight: bold;
                border-bottom: 2px solid #d4a574;
                color: #1a365d;
              }
              td {
                padding: 6px 5px;
                border-bottom: 1px solid #eee;
              }
              tr:hover {
                background-color: #fafafa;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .total-row {
                font-weight: bold;
                font-size: 12px;
                border-top: 2px solid #d4a574;
                background-color: #f8f4ef;
              }
              .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
              }
              .signature-line {
                border-top: 1px solid #333;
                width: 200px;
                padding-top: 5px;
                font-size: 9px;
                text-align: center;
              }
              .footer {
                position: fixed;
                bottom: 15px;
                right: 15px;
                font-size: 9px;
                color: #666;
              }
              .page-number {
                position: fixed;
                top: 15px;
                right: 15px;
                font-size: 9px;
                color: #666;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const totalPrice = treatmentRecords.reduce((sum, record) => sum + (record.editedPrice || 0), 0);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch {
      return dateString;
    }
  };

  const getPatientGender = (patient: Patient) => {
    const gender = patient.gender?.toLowerCase();
    if (gender === 'm' || gender === 'male' || gender === 'masculin') return 'M';
    if (gender === 'f' || gender === 'female' || gender === 'feminin') return 'F';
    return '-';
  };

  const getPatientDateOfBirth = (patient: Patient) => {
    if (patient.date_of_birth) {
      return format(new Date(patient.date_of_birth), 'dd.MM.yyyy');
    }
    return '-';
  };

  // Generate a code for each treatment (using first 2-3 digits)
  const getTreatmentCode = (record: TreatmentRecord, index: number) => {
    // Simple code generation - you can customize this
    return String(index + 1).padStart(3, '0');
  };

  // Get doctor name from record
  const getDoctorName = (record: EditableTreatmentRecord) => {
    const doctorName = record.appointments?.doctors?.name;
    return doctorName ? `Dr. ${doctorName}` : '-';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informare Pacient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>Selectează Pacient</Label>
            <Popover open={patientOpen} onOpenChange={setPatientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientOpen}
                  className="w-full justify-between"
                >
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "Caută pacient..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Caută după nume sau telefon..." 
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nu s-au găsit pacienți.</CommandEmpty>
                    <CommandGroup>
                      {filteredPatients.slice(0, 10).map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.first_name} ${patient.last_name} ${patient.phone}`}
                          onSelect={() => {
                            setSelectedPatientId(patient.id);
                            setPatientOpen(false);
                            setPatientSearch('');
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {patient.phone}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Selectează Data</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'dd MMMM yyyy', { locale: ro })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Treatment Records Preview */}
          {selectedPatient && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold mb-2">Informații pacient</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Nume: {selectedPatient.first_name} {selectedPatient.last_name}</div>
                  <div>Telefon: {selectedPatient.phone || '-'}</div>
                  <div>Data nașterii: {getPatientDateOfBirth(selectedPatient)}</div>
                  <div>Gen: {getPatientGender(selectedPatient)}</div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Se încarcă intervențiile...
                </div>
              ) : treatmentRecords.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Dată</th>
                        <th className="px-3 py-2 text-left">Dinți</th>
                        <th className="px-3 py-2 text-left">Denumire</th>
                        <th className="px-3 py-2 text-right pr-6">Preț</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatmentRecords.map((record) => (
                        <tr key={record.id} className="border-t">
                          <td className="px-3 py-2">{formatDate(record.performed_at)}</td>
                          <td className="px-3 py-2">
                            {record.tooth_numbers?.join(', ') || '-'}
                          </td>
                          <td className="px-3 py-2">{record.treatment_name}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              value={record.editedPrice ?? 0}
                              onChange={(e) => handlePriceChange(record.id, parseFloat(e.target.value) || 0)}
                              className="w-24 text-center h-8 ml-auto"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted font-semibold">
                        <td colSpan={3} className="px-3 py-2">TOTAL:</td>
                        <td className="px-3 py-2 text-right">
                          {totalPrice.toLocaleString('ro-RO')} LEI
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nu există intervenții pentru data selectată ({format(selectedDate, 'dd.MM.yyyy')}).
                </div>
              )}

              <Button 
                onClick={handlePrint} 
                className="w-full gap-2"
                disabled={treatmentRecords.length === 0}
              >
                <Printer className="h-4 w-4" />
                Printează Informare
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="page-number">Page 1 of 1</div>
          
          <div className="header">
            <div className="logo-section">
              <img src="/images/perfect-smile-logo-print.jpg" alt="Perfect Smile Logo" className="logo" />
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                PERFECT SMILE GLIM
              </div>
            </div>
            <div className="clinic-contact">
              <div>0721.702.820</div>
              <div>perfectsmilevarteju@gmail.com</div>
              <div>www.perfectsmileglim.ro</div>
              <div>Str. București 68-70, Varteju, Măgurele</div>
            </div>
          </div>

          {selectedPatient && (
            <>
              <div className="patient-info-section">
                <div>
                  <div className="patient-name">
                    {(() => {
                      const g = selectedPatient.gender?.toLowerCase();
                      return (g === 'f' || g === 'female' || g === 'feminin') ? 'Dna.' : 'Dl.';
                    })()} {selectedPatient.last_name} {selectedPatient.first_name}
                  </div>
                  <div className="patient-details-left">
                    <div>
                      <div>Data de naștere</div>
                      <div>{getPatientDateOfBirth(selectedPatient)}</div>
                    </div>
                    <div>
                      <div>Sex</div>
                      <div>{getPatientGender(selectedPatient)}</div>
                    </div>
                  </div>
                </div>
                <div className="patient-details-right">
                  <div>Telefon: {selectedPatient.phone || '-'}</div>
                  <div>Email: {selectedPatient.email || '-'}</div>
                </div>
              </div>

              <div className="section-title">Intervenții realizate</div>
              <div className="date-label">({format(selectedDate, 'dd MMM yyyy', { locale: ro })})</div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Dată</th>
                    <th style={{ width: '8%' }}>Cod</th>
                    <th style={{ width: '10%' }}>Dinți</th>
                    <th style={{ width: '40%' }}>DENUMIRE</th>
                    <th style={{ width: '15%' }}>Medic</th>
                    <th style={{ width: '15%' }} className="text-right">Preț</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentRecords.map((record, index) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.performed_at)}</td>
                      <td className="text-center">{getTreatmentCode(record, index)}</td>
                      <td>{record.tooth_numbers?.join(', ') || '-'}</td>
                      <td>{record.treatment_name}</td>
                      <td>{getDoctorName(record)}</td>
                      <td className="text-right">{(record.editedPrice ?? record.price)?.toLocaleString('ro-RO')} LEI</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={5}><strong>TOTAL:</strong></td>
                    <td className="text-right"><strong>{totalPrice.toLocaleString('ro-RO')} LEI</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div className="signature-section">
                <div className="signature-line">
                  (semnătura pacientului / reprezentantului legal)
                </div>
              </div>

              <div className="footer">
                {format(new Date(), 'MM/dd/yyyy')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientInformation;
