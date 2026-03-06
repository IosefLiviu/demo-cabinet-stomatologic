// Clinic contact information - centralized for easy updates
export const CLINIC = {
  name: 'CABINET DENTAR DEMO SRL',
  shortName: 'CABINET DENTAR DEMO',
  address: 'Strada Exemplu 1, București, România',
  phone: '0700 000 000',
  email: 'office@demo-cabinet.ro',
  website: 'demo-cabinet-stomatologic.vercel.app',

  // Legal info
  regNumber: 'J00/0000/2024',
  fiscalCode: '00000000',

  // Logo paths
  logoPrint: '/images/demo-logo.svg',
  logo: '/images/demo-logo.svg',
} as const;

// Helper function to get copyright text
export const getClinicCopyright = (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  return `© ${currentYear} ${CLINIC.shortName}. Toate drepturile rezervate.`;
};

// Helper to get the absolute URL for the print logo (needed in window.open print windows)
export const getLogoPrintUrl = () => `${window.location.origin}${CLINIC.logoPrint}`;

// Helper function to get full contact line for print footers
export const getClinicContactLine = () => {
  return `${CLINIC.name} | ${CLINIC.address}`;
};

export const getClinicPhoneLine = () => {
  return `Tel: ${CLINIC.phone} | Email: ${CLINIC.email} | ${CLINIC.website}`;
};
