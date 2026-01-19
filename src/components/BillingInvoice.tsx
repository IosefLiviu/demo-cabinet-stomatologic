import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Printer, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTreatments } from '@/hooks/useTreatments';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  cnp?: string | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface BillingInvoiceProps {
  patients: Patient[];
}

const BillingInvoice: React.FC<BillingInvoiceProps> = ({ patients }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { treatments } = useTreatments();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [preparedBy, setPreparedBy] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0 }
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const initialValue = item.quantity * item.unitPrice;
    const discountAmount = initialValue * (item.discount / 100);
    return initialValue - discountAmount;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Helper function to escape HTML entities
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const total = calculateTotal();
    const formattedDate = invoiceDate ? format(new Date(invoiceDate), 'dd.MM.yyyy', { locale: ro }) : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ro">
        <head>
          <meta charset="UTF-8">
          <title>Proformă ${escapeHtml(invoiceNumber)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              color: #000; 
              font-size: 11px;
              line-height: 1.4;
            }
            .document-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 10px;
            }
            .supplier-info {
              max-width: 45%;
            }
            .supplier-info p {
              margin: 1px 0;
            }
            .logo-section {
              text-align: center;
            }
            .logo {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            .phone-email {
              font-size: 9px;
              margin-top: 3px;
            }
            .client-info {
              max-width: 35%;
              text-align: right;
            }
            .client-info p {
              margin: 1px 0;
            }
            .title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0 10px 0;
            }
            .invoice-details {
              text-align: center;
              border: 1px solid #000;
              padding: 8px;
              margin: 0 auto 20px auto;
              width: 200px;
            }
            .invoice-details p {
              margin: 2px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: center;
              font-size: 10px;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
            }
            td.description {
              text-align: left;
            }
            td.amount {
              text-align: right;
            }
            .legal-note {
              font-size: 9px;
              margin: 15px 0;
              padding: 5px;
              border-top: 1px solid #000;
            }
            .footer-section {
              display: flex;
              border: 1px solid #000;
              margin-top: 10px;
            }
            .footer-left {
              width: 30%;
              padding: 8px;
              border-right: 1px solid #000;
            }
            .footer-middle {
              width: 40%;
              padding: 8px;
              border-right: 1px solid #000;
              font-size: 9px;
            }
            .footer-middle p {
              margin: 2px 0;
            }
            .footer-right {
              width: 30%;
              padding: 8px;
            }
            .footer-right table {
              border: none;
              margin: 0;
            }
            .footer-right td {
              border: none;
              padding: 3px;
              text-align: left;
              font-size: 10px;
            }
            .footer-right td.value {
              text-align: right;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <div class="supplier-info">
              <p><strong>Furnizor: PERFECT SMILE GLIM SRL</strong></p>
              <p>Nr. Înreg: J23/5347/2023</p>
              <p>Cod Fiscal: 48655560</p>
              <p>Capital social: 0</p>
              <p>Adresă: Str. Diamantului, Nr. 113, Bl. 3C, Et. 5, Ap.</p>
              <p style="padding-left: 40px;">40, Ilfov</p>
              <p>IBAN:</p>
            </div>
            <div class="logo-section">
              <img src="/images/perfect-smile-logo-print.png" alt="Perfect Smile Logo" class="logo" />
              <div class="phone-email">
                <p>0721.702.820</p>
                <p>perfectsmilevarteju@gmail.com</p>
              </div>
            </div>
            <div class="client-info">
              <p><strong>Client: ${selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : ''}</strong></p>
              <p>Adresă: ${selectedPatient?.address || ''} ${selectedPatient?.city ? `, ${selectedPatient.city}` : ''}</p>
              ${selectedPatient?.cnp ? `<p>CNP: ${selectedPatient.cnp}</p>` : ''}
            </div>
          </div>

          <div class="title">Proformă</div>
          
          <div class="invoice-details">
            <p><strong>Număr: ${invoiceNumber}</strong></p>
            <p><strong>Data(zi.lună.an): ${formattedDate}</strong></p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%">Nr crt</th>
                <th style="width: 37%">Denumirea produselor sau a serviciilor</th>
                <th style="width: 8%">Cant</th>
                <th style="width: 15%">Valoare inițială</th>
                <th style="width: 7%">%</th>
                <th style="width: 12%">Preț unitar</th>
                <th style="width: 13%">Valoarea - LEI</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => {
                const initialValue = item.quantity * item.unitPrice;
                const finalValue = calculateItemTotal(item);
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td class="description">${escapeHtml(item.description || '')}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">${initialValue.toFixed(2)}</td>
                    <td>${item.discount > 0 ? item.discount : ''}</td>
                    <td class="amount">${item.unitPrice.toFixed(2)}</td>
                    <td class="amount">${finalValue.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="legal-note">
            Factura circulă fără semnătură și ștampilă cf. art. 319, alin. 29 din L. Nr. 227/2015 Cod Fiscal
          </div>

          <div class="footer-section">
            <div class="footer-left">
              <p><strong>Document întocmit de</strong></p>
              <p>${preparedBy}</p>
            </div>
            <div class="footer-middle">
              <p><strong>Date privind expediția:</strong></p>
              <p>Numele delegatului:</p>
              <p>B.I./C.I. Seria: .......... Nr: .................. Eliberat de:</p>
              <p>....................</p>
              <p>Mijloc de transport:</p>
              <p>Expedierea s-a făcut în prezența noastră la data de</p>
              <p>Semnăturile:.................................................</p>
            </div>
            <div class="footer-right">
              <table>
                <tr>
                  <td>TOTAL</td>
                  <td class="value">${total.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Total de plată<br/>Monedă: LEI</td>
                  <td class="value">${total.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="height: 40px;">Semnătură de<br/>primire</td>
                </tr>
              </table>
            </div>
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factură Proformă
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pacient / Client</Label>
              <Select
                value={selectedPatient?.id || ''}
                onValueChange={(value) => {
                  const patient = patients.find(p => p.id === value);
                  setSelectedPatient(patient || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacientul" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.last_name} {patient.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Număr Factură</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="ex: 4716"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Document întocmit de</Label>
            <Input
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="ex: Iulia Gheorghe"
            />
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Produse / Servicii</Label>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adaugă rând
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30">
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    <Label className="text-xs">Denumire serviciu</Label>
                    <Select
                      value={item.description || undefined}
                      onValueChange={(value) => {
                        const treatment = treatments.find(t => t.name === value);
                        updateItem(item.id, 'description', value);
                        if (treatment?.default_price) {
                          updateItem(item.id, 'unitPrice', treatment.default_price);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează serviciul" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.name}>
                            {treatment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs">Cantitate</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs">Preț unitar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 space-y-1">
                    <Label className="text-xs">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded-lg p-4 min-w-[200px]">
              <div className="text-sm text-muted-foreground">Total de plată</div>
              <div className="text-2xl font-bold text-primary">
                {calculateTotal().toFixed(2)} LEI
              </div>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Printează Proforma
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingInvoice;
