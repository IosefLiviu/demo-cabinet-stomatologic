import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Printer, Plus, Trash2, History, Search, Eye } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface SavedPrescription {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  prescription_date: string;
  judet: string;
  localitate: string;
  unitate_sanitara: string;
  nr_fisa: string | null;
  diagnostic: string | null;
  created_at: string;
  patients?: {
    first_name: string;
    last_name: string;
    cnp: string | null;
  };
  doctors?: {
    name: string;
  } | null;
  prescription_items?: {
    id: string;
    medication: string;
    quantity: string | null;
    dosage: string | null;
    sort_order: number;
  }[];
}

interface PrescriptionFormProps {
  patients: Patient[];
  doctors: Doctor[];
}

// Lista predefinită de diagnostice stomatologice (conform CMSR)
const PREDEFINED_DIAGNOSTICS = [
  // Cod 543 - Anomalii dentare
  { name: 'Anodontia', code: '543' },
  { name: 'Dinți supranumerari', code: '543' },
  { name: 'Anomalii de volum și de formă ale dinților', code: '543' },
  { name: 'Dinți pătați', code: '543' },
  { name: 'Tulburări de formare a dinților', code: '543' },
  { name: 'Anomalii ereditare ale structurii dentare, neclasificate altundeva', code: '543' },
  { name: 'Tulburări de erupție dentară', code: '543' },
  { name: 'Sindromul de erupție dentară', code: '543' },
  { name: 'Alte tulburări de odontogeneză', code: '543' },
  { name: 'Tulburări de odontogeneză, nespecificate', code: '543' },
  { name: 'Dinți incluși', code: '543' },
  { name: 'Dinți inclavați', code: '543' },
  // Cod 544 - Carii dentare
  { name: 'Caria limitată la smalț', code: '544' },
  { name: 'Caria dentinei', code: '544' },
  { name: 'Caria cimentului', code: '544' },
  { name: 'Caria dentară stabilizată', code: '544' },
  { name: 'Odontoclazia', code: '544' },
  { name: 'Alte carii dentare', code: '544' },
  { name: 'Carie dentară, nespecificată', code: '544' },
  // Cod 555 - Alte boli ale țesutului dur
  { name: 'Frecarea excesivă a dinților', code: '555' },
  { name: 'Abraziunea dinților', code: '555' },
  { name: 'Eroziunea dinților', code: '555' },
  { name: 'Rezorbția patologică a dinților', code: '555' },
  { name: 'Hipercimentoză', code: '555' },
  { name: 'Anchiloză dentară', code: '555' },
  { name: 'Depozite [acumulare] pe dinți', code: '555' },
  { name: 'Modificări ale culorii țesutului dentar dur după erupție', code: '555' },
  { name: 'Alte boli specificate ale țesutului dentar dur', code: '555' },
  { name: 'Boala țesutului dentar dur, nespecificată', code: '555' },
  // Cod 546 - Boli pulpare
  { name: 'Pulpită', code: '546' },
  { name: 'Necroza pulpară', code: '546' },
  { name: 'Degenerescența pulpară', code: '546' },
  { name: 'Formațiune anormală de țesut dentar dur în pulpă', code: '546' },
  { name: 'Periodontită apicală acută de origine pulpară', code: '546' },
  { name: 'Periodontită apicală cronică', code: '546' },
  { name: 'Abces periapical cu fistulă', code: '546' },
  { name: 'Abces periapical fără fistulă', code: '546' },
  { name: 'Chist radicular', code: '546' },
  // Cod 547 - Boli gingivale și parodontale
  { name: 'Gingivită acută', code: '547' },
  { name: 'Gingivită cronică', code: '547' },
  { name: 'Parodontită acută', code: '547' },
  { name: 'Parodontită cronică', code: '547' },
  { name: 'Parodontoză', code: '547' },
  { name: 'Recesiune gingivală', code: '547' },
  { name: 'Alte boli ale gingiei și ale crestei alveolare edentate', code: '547' },
  // Alte diagnostice comune
  { name: 'Stomatită', code: '548' },
  { name: 'Abces dentoalveolar', code: '548' },
  { name: 'Pericoronită', code: '548' },
  { name: 'Alveolită', code: '548' },
  { name: 'Disfuncție temporomandibulară', code: '549' },
];

// Lista predefinită de medicamente
const PREDEFINED_MEDICATIONS = [
  // Antibiotice
  { name: 'Augmentin cp. 1000mg', category: 'Antibiotice' },
  { name: 'Augmentin bis 400mg/57mg/5ml (copii 2-8 ani)', category: 'Antibiotice' },
  { name: 'Augmentin ES 600mg/42,9mg/5ml 100ml', category: 'Antibiotice' },
  { name: 'Augmentin ES 400mg', category: 'Antibiotice' },
  { name: 'Ampicilină cp. 500mg', category: 'Antibiotice' },
  { name: 'Flagyl cp. 250mg', category: 'Antibiotice' },
  { name: 'Metronidazol cp. 500mg', category: 'Antibiotice' },
  { name: 'Zinnat cp. 500mg', category: 'Antibiotice' },
  { name: 'Doxiciclină cp. 100mg', category: 'Antibiotice' },
  { name: 'Klabax cp. 500mg', category: 'Antibiotice' },
  { name: 'Ospamox 1000mg', category: 'Antibiotice' },
  { name: 'Cefort cp. 500mg', category: 'Antibiotice' },
  { name: 'Nolicin 400mg', category: 'Antibiotice' },
  { name: 'Ospen cp. 500mg', category: 'Antibiotice' },
  { name: 'Cuminal cp. 500mg', category: 'Antibiotice' },
  { name: 'Clindamycin cpr. 600mg', category: 'Antibiotice' },
  // Antiinflamatoare / Analgezice
  { name: 'Dexametazonă cp. 4mg', category: 'Antiinflamatoare' },
  { name: 'Doreta cp. 75mg/650mg', category: 'Analgezice' },
  { name: 'Doreta cp. 37,5mg/325mg', category: 'Analgezice' },
  { name: 'Arcoxia cp. 90mg', category: 'Antiinflamatoare' },
  { name: 'Ketonal cp. 150mg', category: 'Analgezice' },
  { name: 'Algocalmin cp. 500mg', category: 'Analgezice' },
  { name: 'Algocalmin fiole 1g/2ml soluție injectabilă', category: 'Analgezice' },
  { name: 'Nimesulid 100mg', category: 'Antiinflamatoare' },
  { name: 'Aulin cp. 100mg', category: 'Antiinflamatoare' },
  { name: 'Tadol 25mg', category: 'Analgezice' },
  // Alte medicamente
  { name: 'Colutoriu', category: 'Alte' },
  { name: 'Sinupret', category: 'Alte' },
  { name: 'Sinupret acut', category: 'Alte' },
  { name: 'Masorex Spray', category: 'Alte' },
  { name: 'Olynth', category: 'Alte' },
];

const PrescriptionForm = ({ patients, doctors }: PrescriptionFormProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Tab state
  const [activeSubTab, setActiveSubTab] = useState('new');
  
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

  // History state
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<SavedPrescription | null>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase()) || 
           p.phone.includes(patientSearch);
  });

  // Load prescription history
  const fetchPrescriptions = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (first_name, last_name, cnp),
          doctors (name),
          prescription_items (id, medication, quantity, dosage, sort_order)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchPrescriptions();
    }
  }, [activeSubTab]);

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

  const handleSave = async () => {
    if (!selectedPatientId) {
      toast({ title: 'Eroare', description: 'Selectează un pacient', variant: 'destructive' });
      return;
    }

    const validItems = prescriptionItems.filter(i => i.medication.trim());
    if (validItems.length === 0) {
      toast({ title: 'Eroare', description: 'Adaugă cel puțin un medicament', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Insert prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: selectedPatientId,
          doctor_id: selectedDoctorId || null,
          prescription_date: prescriptionDate,
          judet,
          localitate,
          unitate_sanitara: unitateSanitara,
          nr_fisa: nrFisa || null,
          diagnostic: diagnostic || null,
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Insert prescription items
      const itemsToInsert = validItems.map((item, index) => ({
        prescription_id: prescription.id,
        medication: item.medication,
        quantity: item.quantity || null,
        dosage: item.dosage || null,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: 'Succes', description: 'Rețeta a fost salvată' });
      
      // Optionally print after save
      handlePrint();
      
      // Reset form
      resetForm();
      
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({ title: 'Eroare', description: error.message || 'Nu s-a putut salva rețeta', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (prescription?: SavedPrescription) => {
    const patientToPrint = prescription 
      ? patients.find(p => p.id === prescription.patient_id) 
      : selectedPatient;
    const doctorToPrint = prescription?.doctors || selectedDoctor;
    const itemsToPrint = prescription?.prescription_items?.map(i => ({
      medication: i.medication,
      quantity: i.quantity || '',
      dosage: i.dosage || '',
    })) || prescriptionItems.filter(i => i.medication);

    const printWindow = window.open('', '_blank');
    if (!printWindow || !patientToPrint) return;

    const patientAge = patientToPrint?.date_of_birth ? calculateAge(patientToPrint.date_of_birth) : '';
    const patientAddress = [patientToPrint?.address, patientToPrint?.city].filter(Boolean).join(', ');

    const printJudet = prescription?.judet || judet;
    const printLocalitate = prescription?.localitate || localitate;
    const printUnitate = prescription?.unitate_sanitara || unitateSanitara;
    const printNrFisa = prescription?.nr_fisa || nrFisa || patientToPrint?.cnp || '';
    const printDiagnostic = prescription?.diagnostic || diagnostic;
    const printDate = prescription?.prescription_date || prescriptionDate;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rețetă - ${patientToPrint.first_name} ${patientToPrint.last_name}</title>
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
              color: #1a365d;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #b8860b;
              background: linear-gradient(to right, #fef9e7, #fff8e1, #fef9e7);
              padding: 10px;
              border-radius: 5px;
            }
            .header-logo {
              width: 120px;
              height: 80px;
              object-fit: contain;
            }
            .header-title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: #b8860b;
            }
            .form-row {
              display: flex;
              margin-bottom: 6px;
              align-items: baseline;
            }
            .form-label {
              min-width: 80px;
              color: #b8860b;
              font-weight: bold;
            }
            .form-value {
              flex: 1;
              border-bottom: 1px dotted #b8860b;
              padding-left: 5px;
              min-height: 18px;
              color: #1a365d;
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
              border-top: 2px solid #b8860b;
              background: #fffef5;
              padding: 10px;
              border-radius: 5px;
            }
            .prescription-section strong {
              color: #b8860b;
              font-size: 12pt;
            }
            .prescription-item {
              margin-bottom: 10px;
              padding-left: 10px;
              border-left: 3px solid #b8860b;
            }
            .prescription-number {
              font-weight: bold;
              color: #b8860b;
            }
            .medication-name {
              font-weight: bold;
              margin-left: 5px;
              color: #1a365d;
            }
            .quantity {
              margin-left: 20px;
              color: #2d3748;
            }
            .dosage {
              margin-left: 20px;
              font-style: italic;
              color: #4a5568;
            }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 10px;
              border-top: 1px solid #b8860b;
            }
            .date-section {
              text-align: left;
              color: #1a365d;
            }
            .date-section strong {
              color: #b8860b;
            }
            .signature-section {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #b8860b;
              padding-top: 5px;
              margin-top: 40px;
              font-size: 10pt;
              color: #4a5568;
            }
            .document-footer {
              margin-top: 30px;
              padding-top: 10px;
            }
            .footer-divider {
              border-top: 2px solid #b8860b;
              margin-bottom: 10px;
            }
            .footer-content {
              text-align: center;
              font-size: 8pt;
              color: #666;
            }
            .footer-content p {
              margin: 2px 0;
            }
            .footer-content .copyright {
              margin-top: 5px;
              font-size: 7pt;
              color: #999;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/images/perfect-smile-logo-print.jpg" alt="Perfect Smile Logo" class="header-logo" />
            <div>
              <div class="header-title">REȚETĂ MEDICALĂ</div>
            </div>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Județul:</span>
              <span class="form-value">${printJudet}</span>
            </div>
            <div>
              <span class="form-label">Localitatea:</span>
              <span class="form-value">${printLocalitate}</span>
            </div>
          </div>
          
          <div class="form-row">
            <span class="form-label">Unitatea sanitară:</span>
            <span class="form-value">${printUnitate}</span>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Numele:</span>
              <span class="form-value">${patientToPrint.last_name}</span>
            </div>
            <div>
              <span class="form-label">Prenumele:</span>
              <span class="form-value">${patientToPrint.first_name}</span>
            </div>
          </div>
          
          <div class="form-row-split">
            <div>
              <span class="form-label">Sex M/F:</span>
              <span class="form-value">${patientToPrint.gender === 'M' ? 'M' : patientToPrint.gender === 'F' ? 'F' : ''}</span>
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
            <span class="form-value">${printNrFisa}</span>
          </div>
          
          <div class="form-row">
            <span class="form-label">Diagnostic:</span>
            <span class="form-value">${printDiagnostic}</span>
          </div>
          
          <div class="prescription-section">
            <strong>Rp.</strong>
            ${itemsToPrint.map((item, index) => `
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
              <strong>Data:</strong> ${format(new Date(printDate), 'dd.MM.yyyy')}
            </div>
            <div class="signature-section">
              <div class="signature-line">
                Semnătura și parafa<br/>medicului
                ${doctorToPrint ? `<div style="margin-top: 5px; font-size: 9pt;">${typeof doctorToPrint === 'object' && 'name' in doctorToPrint ? doctorToPrint.name : (doctorToPrint as Doctor).name}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="document-footer">
            <div class="footer-divider"></div>
            <div class="footer-content">
              <p><strong>PERFECT SMILE GLIM SRL</strong> | Str. București 68-70, Vârteju, Măgurele, Ilfov</p>
              <p>Tel: 0721.702.820 | Email: perfectsmilevarteju@gmail.com | www.perfectsmileglim.ro</p>
              <p class="copyright">© ${new Date().getFullYear()} Perfect Smile Glim. Toate drepturile rezervate.</p>
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

  const handleViewPrescription = (prescription: SavedPrescription) => {
    setViewingPrescription(prescription);
    setViewDialogOpen(true);
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!historySearch) return true;
    const searchLower = historySearch.toLowerCase();
    const patientName = `${p.patients?.first_name} ${p.patients?.last_name}`.toLowerCase();
    const doctorName = p.doctors?.name?.toLowerCase() || '';
    const diagnostic = p.diagnostic?.toLowerCase() || '';
    return patientName.includes(searchLower) || 
           doctorName.includes(searchLower) || 
           diagnostic.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Eliberare Rețetă
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="new" className="gap-2">
                <Plus className="h-4 w-4" />
                Rețetă Nouă
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Istoric Rețete
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-6">
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
                  <Select value={diagnostic} onValueChange={setDiagnostic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează diagnostic" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted">Cod 543 - Anomalii dentare</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '543').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Cod 544 - Carii dentare</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '544').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Cod 555 - Boli țesut dur</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '555').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Cod 546 - Boli pulpare</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '546').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Cod 547 - Boli gingivale/parodontale</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '547').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Cod 548/549 - Alte diagnostice</div>
                      {PREDEFINED_DIAGNOSTICS.filter(d => d.code === '548' || d.code === '549').map(diag => (
                        <SelectItem key={diag.name} value={diag.name}>
                          {diag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prescription Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-base font-semibold">Medicamente (Rp.)</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => {
                      const med = PREDEFINED_MEDICATIONS.find(m => m.name === value);
                      if (med) {
                        // Find first empty item or add new one
                        const emptyItem = prescriptionItems.find(i => !i.medication.trim());
                        if (emptyItem) {
                          updatePrescriptionItem(emptyItem.id, 'medication', med.name);
                        } else {
                          setPrescriptionItems([
                            ...prescriptionItems,
                            { id: crypto.randomUUID(), medication: med.name, quantity: '', dosage: '' }
                          ]);
                        }
                      }
                    }}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Selectează medicament predefinit" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted">Antibiotice</div>
                        {PREDEFINED_MEDICATIONS.filter(m => m.category === 'Antibiotice').map(med => (
                          <SelectItem key={med.name} value={med.name}>
                            {med.name}
                          </SelectItem>
                        ))}
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Antiinflamatoare</div>
                        {PREDEFINED_MEDICATIONS.filter(m => m.category === 'Antiinflamatoare').map(med => (
                          <SelectItem key={med.name} value={med.name}>
                            {med.name}
                          </SelectItem>
                        ))}
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Analgezice</div>
                        {PREDEFINED_MEDICATIONS.filter(m => m.category === 'Analgezice').map(med => (
                          <SelectItem key={med.name} value={med.name}>
                            {med.name}
                          </SelectItem>
                        ))}
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted mt-1">Alte</div>
                        {PREDEFINED_MEDICATIONS.filter(m => m.category === 'Alte').map(med => (
                          <SelectItem key={med.name} value={med.name}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={addPrescriptionItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Manual
                    </Button>
                  </div>
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
                          list={`medications-${item.id}`}
                        />
                        <datalist id={`medications-${item.id}`}>
                          {PREDEFINED_MEDICATIONS.map(med => (
                            <option key={med.name} value={med.name} />
                          ))}
                        </datalist>
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
                <Button 
                  onClick={handleSave} 
                  disabled={!selectedPatientId || prescriptionItems.every(i => !i.medication) || saving}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {saving ? 'Se salvează...' : 'Salvează și Printează'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {/* Search */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută după pacient, medic sau diagnostic..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={fetchPrescriptions} disabled={loadingHistory}>
                  {loadingHistory ? 'Se încarcă...' : 'Reîmprospătează'}
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Pacient</TableHead>
                      <TableHead>Medic</TableHead>
                      <TableHead>Diagnostic</TableHead>
                      <TableHead>Medicamente</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {loadingHistory ? 'Se încarcă...' : 'Nu există rețete în istoric'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPrescriptions.map((prescription) => (
                        <TableRow key={prescription.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(prescription.prescription_date), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            {prescription.patients?.first_name} {prescription.patients?.last_name}
                          </TableCell>
                          <TableCell>{prescription.doctors?.name || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {prescription.diagnostic || '-'}
                          </TableCell>
                          <TableCell>
                            {prescription.prescription_items?.length || 0} medicament(e)
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewPrescription(prescription)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePrint(prescription)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalii Rețetă</DialogTitle>
          </DialogHeader>
          {viewingPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <p className="font-medium">
                    {format(new Date(viewingPrescription.prescription_date), 'dd.MM.yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Pacient</Label>
                  <p className="font-medium">
                    {viewingPrescription.patients?.first_name} {viewingPrescription.patients?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Medic</Label>
                  <p className="font-medium">{viewingPrescription.doctors?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Nr. Fișă</Label>
                  <p className="font-medium">{viewingPrescription.nr_fisa || viewingPrescription.patients?.cnp || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Diagnostic</Label>
                  <p className="font-medium">{viewingPrescription.diagnostic || '-'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Medicamente</Label>
                <div className="mt-2 space-y-2">
                  {viewingPrescription.prescription_items?.sort((a, b) => a.sort_order - b.sort_order).map((item, index) => (
                    <div key={item.id} className="p-2 bg-muted/50 rounded">
                      <p className="font-medium">{index + 1}) {item.medication}</p>
                      {item.quantity && <p className="text-sm text-muted-foreground">Nr. {item.quantity}</p>}
                      {item.dosage && <p className="text-sm text-muted-foreground">Ds.int. {item.dosage}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => handlePrint(viewingPrescription)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Printează
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print reference */}
      <div ref={printRef} className="hidden" />
    </div>
  );
};

export default PrescriptionForm;
