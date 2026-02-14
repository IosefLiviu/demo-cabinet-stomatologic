import { useState } from 'react';
import {
  Radio,
  FileText,
  Pill,
  UserCheck,
  Stethoscope,
  FlaskConical,
  FileSignature,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/hooks/usePatients';
import { RadiologyReferral } from './RadiologyReferral';
import BillingInvoice from './BillingInvoice';
import PrescriptionForm from './PrescriptionForm';
import { PatientInformation } from './PatientInformation';
import { SpecialistReferral } from './SpecialistReferral';
import { LabTestReferral } from './LabTestReferral';
import { InformedConsentForm } from './InformedConsentForm';
import { MedicalCertificate } from './MedicalCertificate';
import ProtocolsIndicatii from './ProtocolsIndicatii';

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface PrintablesSectionProps {
  patients: Patient[];
  doctors: Doctor[];
}

const menuItems = [
  { id: 'radiology-referral', label: 'Trimitere Radiologie', icon: Radio, iconColor: 'text-blue-500' },
  { id: 'billing', label: 'Proforma', icon: FileText, iconColor: 'text-emerald-500' },
  { id: 'prescription', label: 'Rețetă', icon: Pill, iconColor: 'text-rose-500' },
  { id: 'patient-info', label: 'Informare Pacient', icon: UserCheck, iconColor: 'text-indigo-500' },
  { id: 'specialist-referral', label: 'Trimitere M. Specialist', icon: Stethoscope, iconColor: 'text-teal-500' },
  { id: 'lab-test-referral', label: 'Trimitere Analize', icon: FlaskConical, iconColor: 'text-purple-500' },
  { id: 'informed-consent', label: 'Consimțământ Informat', icon: FileSignature, iconColor: 'text-amber-500' },
  { id: 'medical-certificate', label: 'Adeverință Medicală', icon: BadgeCheck, iconColor: 'text-cyan-500' },
  { id: 'protocols', label: 'Protocoale & Indicații', icon: ClipboardList, iconColor: 'text-orange-500' },
];

export function PrintablesSection({ patients, doctors }: PrintablesSectionProps) {
  const [activeItem, setActiveItem] = useState('radiology-referral');

  const renderContent = () => {
    switch (activeItem) {
      case 'radiology-referral':
        return <RadiologyReferral patients={patients} doctors={doctors} />;
      case 'billing':
        return <BillingInvoice patients={patients} />;
      case 'prescription':
        return <PrescriptionForm patients={patients} doctors={doctors} />;
      case 'patient-info':
        return <PatientInformation patients={patients} doctors={doctors} />;
      case 'specialist-referral':
        return <SpecialistReferral patients={patients} doctors={doctors} />;
      case 'lab-test-referral':
        return <LabTestReferral patients={patients} doctors={doctors} />;
      case 'informed-consent':
        return <InformedConsentForm patients={patients} doctors={doctors} />;
      case 'medical-certificate':
        return <MedicalCertificate patients={patients} doctors={doctors} />;
      case 'protocols':
        return <ProtocolsIndicatii />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-[600px]">
      {/* Sidebar - horizontal scroll on mobile, vertical on desktop */}
      <nav className="md:w-56 shrink-0 rounded-lg border bg-card p-2 overflow-x-auto md:overflow-x-visible scrollbar-hide">
        <div className="flex md:flex-col gap-1 md:gap-1 min-w-max md:min-w-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors text-left',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : item.iconColor || ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
}
