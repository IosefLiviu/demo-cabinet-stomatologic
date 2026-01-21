// Clinic contact information - centralized for easy updates
export const CLINIC = {
  name: 'PERFECT SMILE GLIM SRL',
  shortName: 'PERFECT SMILE GLIM',
  address: 'Strada București 68-70, Măgurele, România',
  phone: '0721 702 820',
  email: 'office@perfectsmileglim.ro',
  website: 'www.perfectsmileglim.ro',
  
  // Legal info
  regNumber: 'J23/5347/2023',
  fiscalCode: '48655560',
  
  // Logo paths
  logoPrint: '/images/perfect-smile-logo-print.jpg',
  logo: '/images/perfect-smile-logo.png',
} as const;

// Helper function to get copyright text
export const getClinicCopyright = (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  return `© ${currentYear} ${CLINIC.shortName}. Toate drepturile rezervate.`;
};

// Helper function to get full contact line for print footers
export const getClinicContactLine = () => {
  return `${CLINIC.name} | ${CLINIC.address}`;
};

export const getClinicPhoneLine = () => {
  return `Tel: ${CLINIC.phone} | Email: ${CLINIC.email} | ${CLINIC.website}`;
};
