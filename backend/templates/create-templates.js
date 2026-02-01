const XLSX = require('xlsx');

// Create companies template
const wb1 = XLSX.utils.book_new();
const companies = [
  [
    'Nom Entreprise*',
    'Numero ICE*',
    'Telephone*',
    'Email',
    'Adresse',
    'Ville',
    'Region',
    'Code Postal',
    'Secteur Activite',
    'Forme Juridique',
    'Statut',
    'Site Web'
  ],
  [
    'SARL EXEMPLE',
    '000123456789012',
    '0612345678',
    'contact@exemple.ma',
    '123 Rue Example',
    'Rabat',
    'Rabat-Sale-Kenitra',
    '10000',
    'Technologies',
    'SARL',
    'active',
    'www.exemple.ma'
  ]
];

const ws1 = XLSX.utils.aoa_to_sheet(companies);
XLSX.utils.book_append_sheet(wb1, ws1, 'Entreprises');
XLSX.writeFile(wb1, 'template_companies.xlsx');

// Create activities template
const wb2 = XLSX.utils.book_new();
const activities = [
  [
    'Titre Activite*',
    'Type*',
    'ICE Entreprise*',
    'Description',
    'Date Debut*',
    'Date Fin*',
    'Lieu',
    'Budget Prevu',
    'Budget Depense',
    'Nombre Participants',
    'Statut'
  ],
  [
    'Formation Digital Marketing',
    'formation',
    '000123456789012',
    'Formation intensive de 3 jours',
    '2024-01-15',
    '2024-01-17',
    'Rabat',
    '50000',
    '45000',
    '25',
    'completed'
  ]
];

const ws2 = XLSX.utils.aoa_to_sheet(activities);
XLSX.utils.book_append_sheet(wb2, ws2, 'Activites');
XLSX.writeFile(wb2, 'template_activities.xlsx');

console.log('Templates Excel crees avec succes!');
console.log('- template_companies.xlsx');
console.log('- template_activities.xlsx');
