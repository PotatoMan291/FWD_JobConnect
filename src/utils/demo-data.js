import { getDemoStore, saveDemoStore } from './demo-store.js';

const demoCandidates = [
  { id: 101, firstName: 'Valeria', lastName: 'Mora', professionalTitle: 'Ingeniera Frontend Senior', email: 'valeria.mora@demo.jobconnect.com', phone: '+506 8888-0101', company: 'Bright Labs', location: 'Costa Rica', about: 'Especialista en productos web accesibles y escalables.', yearsOfExperience: '7 años', availability: 'Inmediata', workMode: 'Remoto', salaryExpectation: '$3,800 USD', skills: ['JavaScript', 'React', 'Accesibilidad', 'CSS'], recruitmentStatus: 'Entrevista' },
  { id: 102, firstName: 'Diego', lastName: 'Soto', professionalTitle: 'Ingeniero Backend', email: 'diego.soto@demo.jobconnect.com', phone: '+506 8888-0102', company: 'Nube Tica', location: 'Heredia', about: 'Construye APIs robustas y plataformas orientadas a eventos.', yearsOfExperience: '6 años', availability: '15 días', workMode: 'Hibrido', salaryExpectation: '$4,200 USD', skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], recruitmentStatus: 'Nuevo' },
  { id: 103, firstName: 'Camila', lastName: 'Rojas', professionalTitle: 'Product Designer', email: 'camila.rojas@demo.jobconnect.com', phone: '+52 5555-0103', company: 'Orbita Digital', location: 'Mexico', about: 'Diseñadora de productos digitales centrados en las personas.', yearsOfExperience: '5 años', availability: 'Inmediata', workMode: 'Remoto', salaryExpectation: '$3,200 USD', skills: ['Figma', 'Research', 'Prototipado', 'Design Systems'], recruitmentStatus: 'En revisión' },
  { id: 104, firstName: 'Mateo', lastName: 'Alonso', professionalTitle: 'Data Engineer', email: 'mateo.alonso@demo.jobconnect.com', phone: '+34 600 010 104', company: 'Datos Abiertos', location: 'Espana', about: 'Ingeniero de datos enfocado en pipelines confiables y observables.', yearsOfExperience: '8 años', availability: '30 días', workMode: 'Hibrido', salaryExpectation: '$4,500 USD', skills: ['Python', 'SQL', 'Spark', 'Airflow'], recruitmentStatus: 'Seleccionado' },
  { id: 105, firstName: 'Sofía', lastName: 'Pineda', professionalTitle: 'QA Automation Lead', email: 'sofia.pineda@demo.jobconnect.com', phone: '+54 11 5555-0105', company: 'Calidad 360', location: 'Argentina', about: 'Lidera estrategias de calidad y automatización para equipos ágiles.', yearsOfExperience: '9 años', availability: 'Inmediata', workMode: 'Remoto', salaryExpectation: '$3,900 USD', skills: ['Playwright', 'Cypress', 'CI/CD', 'Testing'], recruitmentStatus: 'Nuevo' },
  { id: 106, firstName: 'Andrés', lastName: 'Ferreira', professionalTitle: 'Cloud Solutions Architect', email: 'andres.ferreira@demo.jobconnect.com', phone: '+55 11 5555-0106', company: 'Cloud Norte', location: 'Brasil', about: 'Arquitecto cloud con experiencia en modernización y seguridad.', yearsOfExperience: '10 años', availability: '30 días', workMode: 'Presencial', salaryExpectation: '$5,000 USD', skills: ['Azure', 'Terraform', 'Kubernetes', 'Security'], recruitmentStatus: 'Entrevista' }
];

const demoVacancies = [
  { id: 1, createdBy: 3 },
  { id: 2, createdBy: 3 },
  { id: 3, createdBy: 4 },
  { id: 4, createdBy: 4 },
  { id: 6, createdBy: 7 },
  { id: 7, createdBy: 7 },
  { id: 8, createdBy: 8 }
];

const demoApplications = [
  { id: 9101, vacancyId: 1, userId: 101, status: 'Entrevista' },
  { id: 9102, vacancyId: 1, userId: 102, status: 'Nuevo' },
  { id: 9103, vacancyId: 2, userId: 103, status: 'En revisión' },
  { id: 9104, vacancyId: 2, userId: 105, status: 'Nuevo' },
  { id: 9105, vacancyId: 3, userId: 104, status: 'Seleccionado' },
  { id: 9106, vacancyId: 3, userId: 106, status: 'Entrevista' },
  { id: 9107, vacancyId: 4, userId: 102, status: 'Nuevo' },
  { id: 9108, vacancyId: 5, userId: 105, status: 'En revisión' }
];

function seedStore(resourceKey, items) {
  const store = getDemoStore(resourceKey);
  const existingIds = new Set(store.created.map(item => String(item.id)));
  const missing = items.filter(item => !existingIds.has(String(item.id)));
  if (missing.length) {
    store.created = [...missing.map(item => ({ ...item, _isLocal: true })), ...store.created];
    saveDemoStore(resourceKey, store);
  }
}

export function seedDemoData() {
  seedStore('candidatos', demoCandidates);
  seedStore('vacantes', demoVacancies);
  seedStore('postulaciones', demoApplications);
}