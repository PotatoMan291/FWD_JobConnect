import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/src/assets') && !req.originalUrl.endsWith('.svg')) {
    console.log(`[Node.js Express Server] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Servir archivos estáticos del proyecto (HTML, CSS, JS, imágenes, SVG)
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Seed data para usuarios autenticables y roles
const USERS_DB = [
  { id: 1, username: 'emilys', password: 'emilyspass', firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@jobconnect.com', role: 'admin', image: 'https://dummyjson.com/icon/emilys/128' },
  { id: 2, username: 'michaelw', password: 'michaelwpass', firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@jobconnect.com', role: 'admin', image: 'https://dummyjson.com/icon/michaelw/128' },
  { id: 3, username: 'sophiab', password: 'sophiabpass', firstName: 'Sophia', lastName: 'Brown', email: 'sophia.brown@jobconnect.com', role: 'recruiter', image: 'https://dummyjson.com/icon/sophiab/128' },
  { id: 4, username: 'jamesd', password: 'jamesdpass', firstName: 'James', lastName: 'Davis', email: 'james.davis@jobconnect.com', role: 'recruiter', image: 'https://dummyjson.com/icon/jamesd/128' },
  { id: 5, username: 'oliviaw', password: 'oliviawpass', firstName: 'Olivia', lastName: 'Wilson', email: 'olivia.wilson@jobconnect.com', role: 'user', image: 'https://dummyjson.com/icon/oliviaw/128' },
  { id: 6, username: 'benjaminw', password: 'benjaminwpass', firstName: 'Benjamin', lastName: 'Wilson', email: 'benjamin.wilson@jobconnect.com', role: 'user', image: 'https://dummyjson.com/icon/benjaminw/128' }
];

// Seed data para Candidatos (/api/users)
let candidatos = [
  { id: 1, firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@x.dummyjson.com', phone: '+1 555-0192', company: { name: 'Tech Talent Inc.' }, role: 'Directora HR', image: 'https://dummyjson.com/icon/emilys/128' },
  { id: 2, firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@x.dummyjson.com', phone: '+1 555-0183', company: { name: 'Global Executive Search' }, role: 'Consultor Senior', image: 'https://dummyjson.com/icon/michaelw/128' },
  { id: 3, firstName: 'Sophia', lastName: 'Brown', email: 'sophia.brown@x.dummyjson.com', phone: '+1 555-0174', company: { name: 'Talent Solutions Corp' }, role: 'Reclutadora Lead', image: 'https://dummyjson.com/icon/sophiab/128' },
  { id: 4, firstName: 'James', lastName: 'Davis', email: 'james.davis@x.dummyjson.com', phone: '+1 555-0165', company: { name: 'Innovate HR' }, role: 'Headhunter IT', image: 'https://dummyjson.com/icon/jamesd/128' },
  { id: 5, firstName: 'Olivia', lastName: 'Wilson', email: 'olivia.wilson@x.dummyjson.com', phone: '+1 555-0156', company: { name: 'Nexus Placement' }, role: 'Especialista Selección', image: 'https://dummyjson.com/icon/oliviaw/128' },
  { id: 6, firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@jobconnect.com', phone: '+52 55-4123-9800', company: { name: 'Fintech Latam' }, role: 'Senior Developer', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 7, firstName: 'Ana', lastName: 'Gutiérrez', email: 'ana.gutierrez@jobconnect.com', phone: '+34 91-882-9100', company: { name: 'Iberia Tech' }, role: 'Lead UX Designer', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 8, firstName: 'David', lastName: 'Torres', email: 'david.torres@jobconnect.com', phone: '+1 305-991-0022', company: { name: 'Miami Data Systems' }, role: 'Data Engineer', image: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { id: 9, firstName: 'Laura', lastName: 'Ramos', email: 'laura.ramos@jobconnect.com', phone: '+54 11-4821-3300', company: { name: 'Buenos Aires Cloud' }, role: 'DevOps Architect', image: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 10, firstName: 'Roberto', lastName: 'Silva', email: 'roberto.silva@jobconnect.com', phone: '+55 11-9988-1122', company: { name: 'Brasil Code Labs' }, role: 'Product Owner', image: 'https://randomuser.me/api/portraits/men/75.jpg' }
];

// Seed data para Vacantes (/api/products)
let vacantes = [
  { id: 1, title: 'Senior Fullstack Developer (Node.js & React)', category: 'Ingeniería de Software', price: 6500, stock: 3, description: 'Búsqueda ejecutiva para líder técnico con experiencia en arquitecturas distribuidas.' },
  { id: 2, title: 'Lead UX/UI Product Designer', category: 'Diseño & Producto', price: 5800, stock: 2, description: 'Diseño de interfaces complejas para plataformas analíticas de talento.' },
  { id: 3, title: 'Cloud Infrastructure & Security Architect', category: 'Infraestructura Cloud', price: 7200, stock: 1, description: 'Diseño e implementación de clusters AWS/GCP con altos estándares de cumplimiento.' },
  { id: 4, title: 'Director de Reclutamiento IT & Talent Acquisition', category: 'Recursos Humanos', price: 8000, stock: 1, description: 'Liderazgo de equipo regional de adquisición de talento tecnológico.' },
  { id: 5, title: 'Senior Data Engineer (Spark & Snowflake)', category: 'Ciencia de Datos', price: 6200, stock: 4, description: 'Modelado y tuberías de datos para plataformas de inteligencia de mercado.' },
  { id: 6, title: 'QA Automation Lead Engineer (Playwright/Cypress)', category: 'Control de Calidad', price: 4900, stock: 2, description: 'Estrategia de automatización de pruebas end-to-end e integración continua.' },
  { id: 7, title: 'DevOps & Site Reliability Engineer (SRE)', category: 'Operaciones IT', price: 6100, stock: 3, description: 'Monitoreo de alta disponibilidad, Kubernetes y Terraform.' },
  { id: 8, title: 'Mobile iOS Lead Architect (Swift/SwiftUI)', category: 'Desarrollo Móvil', price: 6400, stock: 2, description: 'Desarrollo de aplicaciones nativas de alto rendimiento para banca privada.' }
];

// Seed data para Empresas / Cuentas Corporativas (/api/carts)
const VACANCY_DETAILS = {
  1: { companyName: 'Nexo Digital', location: 'San José, Costa Rica', modality: 'Híbrido', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5800, salaryMax: 7200, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Construye productos digitales escalables para organizaciones de la región.', responsibilities: ['Diseñar servicios Node.js y aplicaciones React.', 'Acompañar decisiones de arquitectura.', 'Colaborar con producto y diseño.'], requirements: ['Experiencia sólida con Node.js y React.', 'Dominio de APIs REST y SQL.', 'Comunicación efectiva.'], benefits: ['Horario flexible.', 'Presupuesto de formación.', 'Modalidad híbrida.'], skills: ['Node.js', 'React', 'SQL', 'APIs', 'Arquitectura'], publishedAt: '2026-08-10', closingDate: '2026-09-10', featured: true, companyDescription: 'Empresa de tecnología enfocada en productos digitales para América Latina.' },
  2: { companyName: 'Estudio Atlas', location: 'Heredia, Costa Rica', modality: 'Remoto', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5000, salaryMax: 6200, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Lidera experiencias claras y accesibles para una plataforma de talento.', responsibilities: ['Dirigir investigación de experiencia.', 'Definir flujos y componentes.', 'Acompañar la implementación.'], requirements: ['Portafolio de productos digitales.', 'Experiencia con sistemas de diseño.', 'Conocimiento de accesibilidad.'], benefits: ['Trabajo remoto.', 'Días personales.', 'Equipo para trabajo en casa.'], skills: ['Figma', 'Research', 'UI Design', 'Accesibilidad', 'Prototipado'], publishedAt: '2026-08-12', closingDate: '2026-09-12', featured: true, companyDescription: 'Estudio de producto digital para equipos de personas y operaciones.' },
  3: { companyName: 'Prisma Nube', location: 'Escazú, Costa Rica', modality: 'Híbrido', contractType: 'Servicios profesionales', experienceLevel: 'Senior', salaryMin: 6500, salaryMax: 8000, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Define una plataforma cloud segura y preparada para alto crecimiento.', responsibilities: ['Diseñar arquitecturas cloud seguras.', 'Definir estándares de observabilidad.', 'Guiar migraciones de infraestructura.'], requirements: ['Experiencia con AWS o GCP.', 'Conocimientos de Kubernetes y Terraform.', 'Práctica en seguridad cloud.'], benefits: ['Proyecto de alto impacto.', 'Horario flexible.', 'Formación especializada.'], skills: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'Seguridad'], publishedAt: '2026-08-14', closingDate: '2026-09-14', featured: true, companyDescription: 'Consultora técnica especializada en plataformas cloud y confiabilidad.' },
  4: { companyName: 'Talento Norte', location: 'Alajuela, Costa Rica', modality: 'Presencial', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 7000, salaryMax: 9000, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Dirige una estrategia regional de atracción de talento tecnológico.', responsibilities: ['Definir estrategia de atracción.', 'Liderar el equipo de reclutamiento.', 'Dar seguimiento a indicadores.'], requirements: ['Experiencia liderando reclutamiento IT.', 'Dominio de métricas de talento.', 'Negociación con líderes ejecutivos.'], benefits: ['Seguro médico.', 'Bono anual.', 'Plan de desarrollo directivo.'], skills: ['Talent Acquisition', 'Liderazgo', 'Estrategia', 'Entrevistas', 'Métricas'], publishedAt: '2026-08-16', closingDate: '2026-09-16', featured: true, companyDescription: 'Firma regional dedicada a construir equipos tecnológicos en crecimiento.' },
  5: { companyName: 'Vector Datos', location: 'Cartago, Costa Rica', modality: 'Remoto', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5600, salaryMax: 6800, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Crea plataformas de datos confiables para decisiones de negocio.', responsibilities: ['Construir pipelines escalables.', 'Optimizar modelos analíticos.', 'Asegurar calidad de datos.'], requirements: ['Experiencia con Spark y SQL.', 'Conocimiento de Snowflake.', 'Práctica en modelado de datos.'], benefits: ['Trabajo remoto.', 'Bono de conectividad.', 'Capacitación técnica.'], skills: ['Spark', 'Snowflake', 'SQL', 'Python', 'ETL'], publishedAt: '2026-08-18', closingDate: '2026-09-18', featured: false, companyDescription: 'Empresa de analítica de datos para mercados regionales.' },
  6: { companyName: 'Calidad Continua', location: 'San José, Costa Rica', modality: 'Híbrido', contractType: 'Tiempo completo', experienceLevel: 'Intermedio', salaryMin: 4300, salaryMax: 5500, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Impulsa una cultura de calidad y automatización en productos web.', responsibilities: ['Crear estrategias de automatización.', 'Mantener suites end-to-end.', 'Mejorar procesos de calidad.'], requirements: ['Experiencia con Playwright o Cypress.', 'Conocimiento de CI/CD.', 'Criterio para diseño de pruebas.'], benefits: ['Jornada flexible.', 'Programa de certificaciones.', 'Modalidad híbrida.'], skills: ['Playwright', 'Cypress', 'CI/CD', 'Testing', 'JavaScript'], publishedAt: '2026-08-19', closingDate: '2026-09-19', featured: false, companyDescription: 'Equipo de ingeniería que impulsa la mejora continua de productos digitales.' },
  7: { companyName: 'Horizonte Cloud', location: 'Santa Ana, Costa Rica', modality: 'Híbrido', contractType: 'Servicios profesionales', experienceLevel: 'Senior', salaryMin: 5400, salaryMax: 6900, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Asegura plataformas resilientes, observables y eficientes.', responsibilities: ['Mejorar confiabilidad de servicios.', 'Automatizar infraestructura.', 'Definir alertas y objetivos de servicio.'], requirements: ['Experiencia en SRE o DevOps.', 'Dominio de Kubernetes y Terraform.', 'Conocimiento de observabilidad.'], benefits: ['Horario flexible.', 'Trabajo híbrido.', 'Plan técnico.'], skills: ['Kubernetes', 'Terraform', 'Observabilidad', 'CI/CD', 'Linux'], publishedAt: '2026-08-20', closingDate: '2026-09-20', featured: false, companyDescription: 'Proveedor de servicios cloud para operaciones críticas.' },
  8: { companyName: 'Lumen Mobile', location: 'Belén, Costa Rica', modality: 'Presencial', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5700, salaryMax: 7100, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Define la arquitectura de experiencias móviles de alta calidad.', responsibilities: ['Definir arquitectura iOS.', 'Mentorear a desarrolladores.', 'Asegurar calidad y rendimiento.'], requirements: ['Experiencia con Swift y SwiftUI.', 'Conocimiento de arquitectura móvil.', 'Experiencia liderando iniciativas.'], benefits: ['Seguro médico.', 'Presupuesto de formación.', 'Facilidades de movilidad.'], skills: ['Swift', 'SwiftUI', 'iOS', 'Arquitectura', 'Mentoría'], publishedAt: '2026-08-21', closingDate: '2026-09-21', featured: false, companyDescription: 'Equipo de producto que crea experiencias móviles para servicios digitales.' }
};

vacantes = vacantes.map(vacante => ({ ...vacante, ...VACANCY_DETAILS[vacante.id] }));

let empresas = [
  { id: 1, userId: 1, total: 28500, totalProducts: 4, products: [{ id: 1, quantity: 2 }, { id: 3, quantity: 1 }] },
  { id: 2, userId: 2, total: 19800, totalProducts: 3, products: [{ id: 2, quantity: 2 }, { id: 5, quantity: 1 }] },
  { id: 3, userId: 3, total: 34000, totalProducts: 5, products: [{ id: 4, quantity: 1 }, { id: 7, quantity: 2 }] },
  { id: 4, userId: 4, total: 15200, totalProducts: 2, products: [{ id: 6, quantity: 2 }] }
];

// Seed data para Postulaciones (/api/posts)
let postulaciones = [
  { id: 1, title: 'Postulación a Senior Fullstack Developer — Perfil Destacado', body: 'Candidato con 8 años de experiencia en desarrollo web moderno, arquitecturas limpias y consumo de servicios RESTful.', userId: 1, views: 142 },
  { id: 2, title: 'Evaluación Técnica UX/UI Lead Product Designer', body: 'Portfolio auditado con excelencia visual, sistemas de diseño dinámicos y prototipado interactivo avanzado.', userId: 2, views: 98 },
  { id: 3, title: 'Candidatura Cloud Architect AWS/GCP', body: 'Certificación profesional AWS Solutions Architect, amplia trayectoria en migración cloud e infraestructura como código.', userId: 3, views: 210 },
  { id: 4, title: 'Requisición Reclutador IT Senior Latam', body: 'Amplia red de contactos en mercado tecnológico de América Latina y España, métricas de retención sobresalientes.', userId: 4, views: 76 }
];

// Seed data para Entrevistas / Feedback (/api/comments)
let entrevistas = [
  { id: 1, body: 'Entrevista técnica completada satisfactoriamente. Excelente dominio de patrones de diseño, comunicación asertiva y resolución de problemas.', user: { id: 1, username: 'emilys', fullName: 'Emily Johnson' }, postId: 1 },
  { id: 2, body: 'Revisión de portfolio UI completada. Sobresaliente en accesibilidad, tipografía y consistencia en sistemas de diseño.', user: { id: 3, username: 'sophiab', fullName: 'Sophia Brown' }, postId: 2 },
  { id: 3, body: 'Prueba práctica de arquitectura Cloud aprobada con 98% de rendimiento. Candidato recomendado para propuesta salarial.', user: { id: 2, username: 'michaelw', fullName: 'Michael Williams' }, postId: 3 }
];

// Seed data para Tareas Pendientes (/api/todos)
let tareas = [
  { id: 1, todo: 'Enviar propuesta económica formal para vacante Senior Fullstack', completed: true, userId: 1 },
  { id: 2, todo: 'Programar entrevista técnica con Director de Tecnología', completed: false, userId: 2 },
  { id: 3, todo: 'Verificar referencias laborales y antecedentes profesionales de candidatos', completed: false, userId: 3 },
  { id: 4, todo: 'Actualizar matriz de rangos salariales para mercado Q3/Q4', completed: true, userId: 4 },
  { id: 5, todo: 'Publicar nueva requisición corporativa para Lead Data Engineer', completed: false, userId: 5 }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'online', service: 'JobConnect Express Unified Server', port: PORT });
});

// Autenticación Endpoint: POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS_DB.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(400).json({ message: 'Credenciales inválidas. Por favor intente con emilys / emilyspass' });
  }

  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    accessToken: token,
    token: token,
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    image: user.image
  });
});

// Helper de paginación y búsqueda
function paginateAndFilter(list, req, searchFields = []) {
  const skip = parseInt(req.query.skip || '0', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';

  let filtered = list;
  if (q && searchFields.length > 0) {
    filtered = list.filter(item =>
      searchFields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);

  return { items: paginated, total, skip, limit };
}

// Endpoints Candidatos (/api/users)
app.get(['/api/users', '/api/users/search'], (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(candidatos, req, ['firstName', 'lastName', 'email', 'role']);
  res.json({ users: items, total, skip, limit });
});

app.get('/api/users/:id', (req, res) => {
  const item = candidatos.find(c => String(c.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Candidato no encontrado' });
  res.json(item);
});

app.post('/api/users/add', (req, res) => {
  const newObj = { id: candidatos.length + 1, ...req.body };
  candidatos.unshift(newObj);
  res.status(201).json(newObj);
});

app.put('/api/users/:id', (req, res) => {
  const idx = candidatos.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Candidato no encontrado' });
  candidatos[idx] = { id: parseInt(req.params.id, 10), ...req.body };
  res.json(candidatos[idx]);
});

app.patch('/api/users/:id', (req, res) => {
  const idx = candidatos.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Candidato no encontrado' });
  candidatos[idx] = { ...candidatos[idx], ...req.body };
  res.json(candidatos[idx]);
});

app.delete('/api/users/:id', (req, res) => {
  const idx = candidatos.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Candidato no encontrado' });
  const deleted = candidatos.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Endpoints Vacantes (/api/products)
app.get(['/api/products', '/api/products/search'], (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(vacantes, req, ['title', 'category']);
  res.json({ products: items, total, skip, limit });
});

app.get('/api/products/:id', (req, res) => {
  const item = vacantes.find(v => String(v.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Vacante no encontrada' });
  res.json(item);
});

app.post('/api/products/add', (req, res) => {
  const newObj = { id: vacantes.length + 1, ...req.body };
  vacantes.unshift(newObj);
  res.status(201).json(newObj);
});

app.put('/api/products/:id', (req, res) => {
  const idx = vacantes.findIndex(v => String(v.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Vacante no encontrada' });
  vacantes[idx] = { id: parseInt(req.params.id, 10), ...req.body };
  res.json(vacantes[idx]);
});

app.patch('/api/products/:id', (req, res) => {
  const idx = vacantes.findIndex(v => String(v.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Vacante no encontrada' });
  vacantes[idx] = { ...vacantes[idx], ...req.body };
  res.json(vacantes[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const idx = vacantes.findIndex(v => String(v.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Vacante no encontrada' });
  const deleted = vacantes.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Endpoints Empresas (/api/carts)
app.get('/api/carts', (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(empresas, req);
  res.json({ carts: items, total, skip, limit });
});

app.get('/api/carts/:id', (req, res) => {
  const item = empresas.find(e => String(e.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Empresa no encontrada' });
  res.json(item);
});

app.post('/api/carts/add', (req, res) => {
  const newObj = { id: empresas.length + 1, ...req.body };
  empresas.unshift(newObj);
  res.status(201).json(newObj);
});

app.put('/api/carts/:id', (req, res) => {
  const idx = empresas.findIndex(e => String(e.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Empresa no encontrada' });
  empresas[idx] = { id: parseInt(req.params.id, 10), ...req.body };
  res.json(empresas[idx]);
});

app.delete('/api/carts/:id', (req, res) => {
  const idx = empresas.findIndex(e => String(e.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Empresa no encontrada' });
  const deleted = empresas.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Endpoints Postulaciones (/api/posts)
app.get(['/api/posts', '/api/posts/search'], (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(postulaciones, req, ['title', 'body']);
  res.json({ posts: items, total, skip, limit });
});

app.get('/api/posts/:id', (req, res) => {
  const item = postulaciones.find(p => String(p.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Postulación no encontrada' });
  res.json(item);
});

app.post('/api/posts/add', (req, res) => {
  const newObj = { id: postulaciones.length + 1, views: 0, ...req.body };
  postulaciones.unshift(newObj);
  res.status(201).json(newObj);
});

app.patch('/api/posts/:id', (req, res) => {
  const idx = postulaciones.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Postulación no encontrada' });
  postulaciones[idx] = { ...postulaciones[idx], ...req.body };
  res.json(postulaciones[idx]);
});

app.delete('/api/posts/:id', (req, res) => {
  const idx = postulaciones.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Postulación no encontrada' });
  const deleted = postulaciones.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Endpoints Entrevistas (/api/comments)
app.get('/api/comments', (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(entrevistas, req, ['body']);
  res.json({ comments: items, total, skip, limit });
});

app.get('/api/comments/:id', (req, res) => {
  const item = entrevistas.find(c => String(c.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Entrevista no encontrada' });
  res.json(item);
});

app.post('/api/comments/add', (req, res) => {
  const newObj = { id: entrevistas.length + 1, ...req.body };
  entrevistas.unshift(newObj);
  res.status(201).json(newObj);
});

app.patch('/api/comments/:id', (req, res) => {
  const idx = entrevistas.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Entrevista no encontrada' });
  entrevistas[idx] = { ...entrevistas[idx], ...req.body };
  res.json(entrevistas[idx]);
});

app.delete('/api/comments/:id', (req, res) => {
  const idx = entrevistas.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Entrevista no encontrada' });
  const deleted = entrevistas.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Endpoints Tareas (/api/todos)
app.get('/api/todos', (req, res) => {
  const { items, total, skip, limit } = paginateAndFilter(tareas, req, ['todo']);
  res.json({ todos: items, total, skip, limit });
});

app.get('/api/todos/:id', (req, res) => {
  const item = tareas.find(t => String(t.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: 'Tarea no encontrada' });
  res.json(item);
});

app.post('/api/todos/add', (req, res) => {
  const newObj = { id: tareas.length + 1, completed: false, ...req.body };
  tareas.unshift(newObj);
  res.status(201).json(newObj);
});

app.patch('/api/todos/:id', (req, res) => {
  const idx = tareas.findIndex(t => String(t.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Tarea no encontrada' });
  tareas[idx] = { ...tareas[idx], ...req.body };
  res.json(tareas[idx]);
});

app.delete('/api/todos/:id', (req, res) => {
  const idx = tareas.findIndex(t => String(t.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Tarea no encontrada' });
  const deleted = tareas.splice(idx, 1)[0];
  res.json({ isDeleted: true, ...deleted });
});

// Ruta por defecto para la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`JobConnect Express Unified Server ejecutándose en:`);
  console.log(`- Aplicación Web: http://localhost:${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: El puerto ${PORT} está siendo utilizado por otro proceso.`);
    console.error(`Solución: Cierra la otra terminal que está ejecutando Node/Express o ejecuta: npx kill-port ${PORT}\n`);
    process.exit(1);
  } else {
    console.error(err);
  }
});
