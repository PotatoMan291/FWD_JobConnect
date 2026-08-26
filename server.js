import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rankCandidatesWithAi, rankVacanciesWithAi } from './ai-match.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    text.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    });
  } catch {
    // Optional local secrets file
  }
}

loadEnvFile();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  { id: 1, username: 'emilys', password: 'emilyspass', firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@jobconnect.com', role: 'admin', image: '/public/avatars/emilys.svg' },
  { id: 2, username: 'michaelw', password: 'michaelwpass', firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@jobconnect.com', role: 'admin', image: '/public/avatars/michaelw.svg' },
  { id: 3, username: 'sophiab', password: 'sophiabpass', firstName: 'Sophia', lastName: 'Brown', email: 'sophia.brown@jobconnect.com', role: 'recruiter', image: '/public/avatars/sophiab.svg' },
  { id: 4, username: 'jamesd', password: 'jamesdpass', firstName: 'James', lastName: 'Davis', email: 'james.davis@jobconnect.com', role: 'recruiter', image: '/public/avatars/jamesd.svg' },
  { id: 7, username: 'mariag', password: 'mariagpass', firstName: 'Maria', lastName: 'Gomez', email: 'maria.gomez@jobconnect.com', role: 'recruiter', image: '/public/avatars/sophiab.svg' },
  { id: 8, username: 'carlosr', password: 'carlosrpass', firstName: 'Carlos', lastName: 'Ramirez', email: 'carlos.ramirez@jobconnect.com', role: 'recruiter', image: '/public/avatars/jamesd.svg' },
  { id: 5, username: 'oliviaw', password: 'oliviawpass', firstName: 'Olivia', lastName: 'Wilson', email: 'olivia.wilson@jobconnect.com', role: 'user', image: '/public/avatars/oliviaw.svg' },
  { id: 6, username: 'benjaminw', password: 'benjaminwpass', firstName: 'Benjamin', lastName: 'Wilson', email: 'benjamin.wilson@jobconnect.com', role: 'user', image: '/public/avatars/benjaminw.svg' },
  { id: 9, username: 'danielm', password: 'danielmpass', firstName: 'Daniel', lastName: 'Mora', email: 'daniel.mora@jobconnect.com', role: 'user', image: '/public/avatars/oliviaw.svg' },
  { id: 10, username: 'luciap', password: 'luciapass', firstName: 'Lucia', lastName: 'Perez', email: 'lucia.perez@jobconnect.com', role: 'user', image: '/public/avatars/benjaminw.svg' }
];

// Seed data para Candidatos (/api/users)
let candidatos = [
  { id: 1, firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@x.dummyjson.com', phone: '+1 555-0192', company: { name: 'Tech Talent Inc.' }, role: 'Directora HR', image: 'https://randomuser.me/api/portraits/women/32.jpg' },
  { id: 2, firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@x.dummyjson.com', phone: '+1 555-0183', company: { name: 'Global Executive Search' }, role: 'Consultor Senior', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 3, firstName: 'Sophia', lastName: 'Brown', email: 'sophia.brown@x.dummyjson.com', phone: '+1 555-0174', company: { name: 'Talent Solutions Corp' }, role: 'Reclutadora Lead', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 4, firstName: 'James', lastName: 'Davis', email: 'james.davis@x.dummyjson.com', phone: '+1 555-0165', company: { name: 'Innovate HR' }, role: 'Headhunter IT', image: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 5, firstName: 'Olivia', lastName: 'Wilson', email: 'olivia.wilson@x.dummyjson.com', phone: '+1 555-0156', company: { name: 'Nexus Placement' }, role: 'Especialista Selección', image: 'https://randomuser.me/api/portraits/women/79.jpg' },
  { id: 6, firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@jobconnect.com', phone: '+52 55-4123-9800', company: { name: 'Fintech Latam' }, role: 'Senior Developer', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 7, firstName: 'Ana', lastName: 'Gutiérrez', email: 'ana.gutierrez@jobconnect.com', phone: '+34 91-882-9100', company: { name: 'Iberia Tech' }, role: 'Lead UX Designer', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 8, firstName: 'David', lastName: 'Torres', email: 'david.torres@jobconnect.com', phone: '+1 305-991-0022', company: { name: 'Miami Data Systems' }, role: 'Data Engineer', image: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { id: 9, firstName: 'Laura', lastName: 'Ramos', email: 'laura.ramos@jobconnect.com', phone: '+54 11-4821-3300', company: { name: 'Buenos Aires Cloud' }, role: 'DevOps Architect', image: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 10, firstName: 'Roberto', lastName: 'Silva', email: 'roberto.silva@jobconnect.com', phone: '+55 11-9988-1122', company: { name: 'Brasil Code Labs' }, role: 'Product Owner', image: 'https://randomuser.me/api/portraits/men/75.jpg' }
];

const CANDIDATE_DETAILS = {
  1: { location: 'San Jose, Costa Rica', about: 'Lider de personas y cultura con enfoque en construir equipos de alto rendimiento y experiencias de trabajo inclusivas.', coverLetter: 'Me interesa aportar mi experiencia en estrategia de talento y desarrollo organizacional para acompañar el crecimiento sostenible de la empresa.', yearsOfExperience: '9 años', availability: 'Disponible en 2 semanas', workMode: 'Hibrido', salaryExpectation: '$4,800 - $5,500 USD mensuales', education: [{ institution: 'Universidad de Costa Rica', degree: 'Licenciatura en Psicologia', specialty: 'Gestion del Talento Humano', period: '2011 - 2016' }], experience: [{ title: 'Directora de Recursos Humanos', company: 'Tech Talent Inc.', startDate: '2021', endDate: 'Actualidad', description: 'Lidera la estrategia de talento para equipos de tecnologia y producto.', achievements: ['Redujo la rotacion anual en 18%', 'Implemento un programa de liderazgo'] }], skills: ['People Analytics', 'Liderazgo', 'Cultura organizacional', 'Recruiting', 'Compensacion'] },
  2: { location: 'Ciudad de Mexico, Mexico', about: 'Consultor senior especializado en seleccion ejecutiva, evaluacion por competencias y acompanamiento de lideres.', coverLetter: 'Puedo ayudar a identificar perfiles clave y convertir las necesidades del negocio en procesos de contratacion claros y medibles.', yearsOfExperience: '11 años', availability: 'Disponible de inmediato', workMode: 'Remoto', salaryExpectation: '$5,200 - $6,000 USD mensuales', education: [{ institution: 'Tecnologico de Monterrey', degree: 'Maestria en Direccion de Recursos Humanos', period: '2014 - 2016' }, { institution: 'Universidad Anahuac', degree: 'Licenciatura en Administracion', period: '2008 - 2012' }], experience: [{ title: 'Consultor Senior de Talento', company: 'Global Executive Search', startDate: '2018', endDate: 'Actualidad', description: 'Acompana procesos de busqueda ejecutiva para empresas regionales.', achievements: ['Cerro mas de 70 posiciones directivas', 'Construyo una red de 2,000 profesionales'] }], skills: ['Executive Search', 'Entrevistas', 'Assessment', 'Negociacion', 'Talent Strategy'] },
  3: { location: 'Heredia, Costa Rica', about: 'Reclutadora orientada a datos que disfruta conectar talento tecnico con equipos que impulsan productos utiles.', coverLetter: 'Mi experiencia combinando tecnologia, investigacion y comunicacion me permite crear procesos de seleccion eficientes y humanos.', yearsOfExperience: '7 años', availability: 'Disponible en 1 mes', workMode: 'Hibrido', salaryExpectation: '$3,800 - $4,600 USD mensuales', education: [{ institution: 'Universidad Latina de Costa Rica', degree: 'Bachillerato en Psicologia', specialty: 'Psicologia Laboral', period: '2012 - 2017' }], experience: [{ title: 'Reclutadora Lead', company: 'Talent Solutions Corp', startDate: '2020', endDate: 'Actualidad', description: 'Coordina reclutamiento tecnico para equipos de ingenieria y producto.', achievements: ['Aumento la contratacion trimestral en 32%', 'Diseno entrevistas estructuradas por competencias'] }], skills: ['Tech Recruiting', 'Sourcing', 'LinkedIn Recruiter', 'People Analytics', 'Entrevistas'] },
  4: { location: 'Alajuela, Costa Rica', about: 'Headhunter especializado en tecnologia, con amplia experiencia entendiendo retos tecnicos y perfiles de alta demanda.', coverLetter: 'Busco participar en proyectos donde la calidad de la evaluacion y la cercania con los candidatos sean prioridades.', yearsOfExperience: '8 años', availability: 'Disponible en 3 semanas', workMode: 'Presencial', salaryExpectation: '$4,200 - $5,000 USD mensuales', education: [{ institution: 'Universidad Nacional de Costa Rica', degree: 'Licenciatura en Administracion', specialty: 'Gestion Empresarial', period: '2010 - 2015' }], experience: [{ title: 'Headhunter IT', company: 'Innovate HR', startDate: '2019', endDate: 'Actualidad', description: 'Realiza busquedas especializadas para posiciones de software y cloud.', achievements: ['Mantiene 92% de satisfaccion de clientes', 'Amplio la red tecnica en Centroamerica'] }], skills: ['Headhunting', 'IT Recruiting', 'Mapeo de mercado', 'Networking', 'Negociacion'] },
  5: { location: 'Cartago, Costa Rica', about: 'Especialista en seleccion con sensibilidad para detectar potencial, acompanando a las personas durante todo el proceso.', coverLetter: 'Me gustaria aportar una experiencia de candidato clara, respetuosa y alineada con las necesidades reales de cada equipo.', yearsOfExperience: '6 años', availability: 'Disponible en 2 semanas', workMode: 'Remoto', salaryExpectation: '$3,500 - $4,200 USD mensuales', education: [{ institution: 'Universidad Hispanoamericana', degree: 'Bachillerato en Recursos Humanos', period: '2013 - 2017' }], experience: [{ title: 'Especialista de Seleccion', company: 'Nexus Placement', startDate: '2021', endDate: 'Actualidad', description: 'Gestiona procesos completos de seleccion para clientes de servicios profesionales.', achievements: ['Mantuvo un 95% de cumplimiento de tiempos', 'Creo guias de comunicacion para candidatos'] }], skills: ['Seleccion', 'Onboarding', 'Entrevistas', 'Comunicacion', 'Administracion de ATS'] },
  6: { location: 'Ciudad de Mexico, Mexico', about: 'Desarrollador senior enfocado en crear productos robustos, mantenibles y faciles de evolucionar.', coverLetter: 'Quiero sumarme a un equipo tecnico donde pueda aportar experiencia en arquitectura, mentorias y entrega continua de valor.', yearsOfExperience: '10 años', availability: 'Disponible de inmediato', workMode: 'Remoto', salaryExpectation: '$6,500 - $7,500 USD mensuales', education: [{ institution: 'Instituto Politecnico Nacional', degree: 'Ingenieria en Sistemas Computacionales', specialty: 'Desarrollo de Software', period: '2010 - 2015' }], experience: [{ title: 'Senior Fullstack Developer', company: 'Fintech Latam', startDate: '2019', endDate: 'Actualidad', description: 'Construye servicios financieros con Node.js, React y bases de datos SQL.', achievements: ['Redujo el tiempo de respuesta de APIs en 40%', 'Mentoreo a cinco desarrolladores'] }], skills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Arquitectura'] },
  7: { location: 'Madrid, Espana', about: 'Diseñadora UX/UI centrada en convertir problemas complejos en experiencias digitales claras, accesibles y elegantes.', coverLetter: 'Me motiva colaborar con producto e ingenieria para crear interfaces que sean utiles, inclusivas y consistentes.', yearsOfExperience: '8 años', availability: 'Disponible en 1 mes', workMode: 'Hibrido', salaryExpectation: '$4,800 - $5,800 USD mensuales', education: [{ institution: 'Universidad Politecnica de Madrid', degree: 'Master en Diseno de Experiencia', period: '2015 - 2017' }, { institution: 'Universidad de Granada', degree: 'Grado en Bellas Artes', period: '2010 - 2014' }], experience: [{ title: 'Lead UX Designer', company: 'Iberia Tech', startDate: '2020', endDate: 'Actualidad', description: 'Define flujos, prototipos y sistemas de diseno para productos B2B.', achievements: ['Implemento un sistema de diseno transversal', 'Mejoro la accesibilidad de la plataforma'] }], skills: ['UX Research', 'Figma', 'Design Systems', 'Prototipado', 'Accesibilidad'] },
  8: { location: 'Miami, Estados Unidos', about: 'Ingeniero de datos apasionado por convertir grandes volúmenes de información en decisiones confiables para el negocio.', coverLetter: 'Busco un reto donde pueda diseñar plataformas de datos escalables y fortalecer la cultura de calidad de información.', yearsOfExperience: '7 años', availability: 'Disponible en 3 semanas', workMode: 'Remoto', salaryExpectation: '$6,000 - $7,000 USD mensuales', education: [{ institution: 'Florida International University', degree: 'Master en Data Science', period: '2016 - 2018' }, { institution: 'University of Miami', degree: 'Bachelor en Computer Science', period: '2012 - 2016' }], experience: [{ title: 'Data Engineer', company: 'Miami Data Systems', startDate: '2021', endDate: 'Actualidad', description: 'Disena pipelines y modelos de datos para analitica operativa.', achievements: ['Automatizo cargas diarias de mas de 20 fuentes', 'Redujo errores de calidad en 28%'] }], skills: ['Python', 'Spark', 'Snowflake', 'SQL', 'Data Quality'] },
  9: { location: 'Buenos Aires, Argentina', about: 'Arquitecta DevOps dedicada a mejorar la confiabilidad, observabilidad y velocidad de entrega de plataformas digitales.', coverLetter: 'Me interesa trabajar con equipos que valoren la automatizacion, la documentacion y la mejora continua de sus operaciones.', yearsOfExperience: '9 años', availability: 'Disponible en 2 meses', workMode: 'Remoto', salaryExpectation: '$6,800 - $8,000 USD mensuales', education: [{ institution: 'Universidad de Buenos Aires', degree: 'Ingenieria Informatica', specialty: 'Infraestructura y Sistemas', period: '2009 - 2015' }], experience: [{ title: 'DevOps Architect', company: 'Buenos Aires Cloud', startDate: '2018', endDate: 'Actualidad', description: 'Define practicas de infraestructura como codigo y confiabilidad.', achievements: ['Aumento la disponibilidad a 99.95%', 'Estandarizo despliegues con Terraform'] }], skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Observabilidad'] },
  10: { location: 'Sao Paulo, Brasil', about: 'Product Owner con enfoque en estrategia, priorizacion y colaboracion entre negocio, diseño e ingenieria.', coverLetter: 'Puedo ayudar a convertir objetivos de negocio en productos medibles, simples de usar y valiosos para sus usuarios.', yearsOfExperience: '8 años', availability: 'Disponible en 1 mes', workMode: 'Hibrido', salaryExpectation: '$5,500 - $6,500 USD mensuales', education: [{ institution: 'Fundacao Getulio Vargas', degree: 'MBA en Gestion de Productos', period: '2016 - 2018' }, { institution: 'Universidade de Sao Paulo', degree: 'Licenciatura en Administracion', period: '2010 - 2014' }], experience: [{ title: 'Product Owner', company: 'Brasil Code Labs', startDate: '2020', endDate: 'Actualidad', description: 'Prioriza el roadmap y coordina la entrega de productos digitales.', achievements: ['Aumento la adopcion del producto en 25%', 'Coordino equipos multidisciplinarios'] }], skills: ['Product Strategy', 'Agile', 'Roadmaps', 'Discovery', 'Metricas'] }
};

candidatos = candidatos.map(candidato => ({ ...candidato, ...CANDIDATE_DETAILS[candidato.id] }));

// Seed data para Vacantes (/api/products)
let vacantes = [
  { id: 1, createdBy: 3, title: 'Senior Fullstack Developer (Node.js & React)', category: 'Ingeniería de Software', price: 6500, stock: 3, description: 'Búsqueda ejecutiva para líder técnico con experiencia en arquitecturas distribuidas.' },
  { id: 2, createdBy: 3, title: 'Lead UX/UI Product Designer', category: 'Diseño & Producto', price: 5800, stock: 2, description: 'Diseño de interfaces complejas para plataformas analíticas de talento.' },
  { id: 3, createdBy: 4, title: 'Cloud Infrastructure & Security Architect', category: 'Infraestructura Cloud', price: 7200, stock: 1, description: 'Diseño e implementación de clusters AWS/GCP con altos estándares de cumplimiento.' },
  { id: 4, createdBy: 4, title: 'Director de Reclutamiento IT & Talent Acquisition', category: 'Recursos Humanos', price: 8000, stock: 1, description: 'Liderazgo de equipo regional de adquisición de talento tecnológico.' },
  { id: 5, createdBy: 3, title: 'Senior Data Engineer (Spark & Snowflake)', category: 'Ciencia de Datos', price: 6200, stock: 4, description: 'Modelado y tuberías de datos para plataformas de inteligencia de mercado.' },
  { id: 6, createdBy: 7, title: 'QA Automation Lead Engineer (Playwright/Cypress)', category: 'Control de Calidad', price: 4900, stock: 2, description: 'Estrategia de automatización de pruebas end-to-end e integración continua.' },
  { id: 7, createdBy: 7, title: 'DevOps & Site Reliability Engineer (SRE)', category: 'Operaciones IT', price: 6100, stock: 3, description: 'Monitoreo de alta disponibilidad, Kubernetes y Terraform.' },
  { id: 8, createdBy: 8, title: 'Mobile iOS Lead Architect (Swift/SwiftUI)', category: 'Desarrollo Móvil', price: 6400, stock: 2, description: 'Desarrollo de aplicaciones nativas de alto rendimiento para banca privada.' }
];

// Seed data para Empresas / Cuentas Corporativas (/api/carts)
const VACANCY_DETAILS = {
  1: { companyName: 'Nexo Digital', companyImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=82', location: 'San José, Costa Rica', modality: 'Híbrido', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5800, salaryMax: 7200, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Construye productos digitales escalables para organizaciones de la región.', responsibilities: ['Diseñar servicios Node.js y aplicaciones React.', 'Acompañar decisiones de arquitectura.', 'Colaborar con producto y diseño.'], requirements: ['Experiencia sólida con Node.js y React.', 'Dominio de APIs REST y SQL.', 'Comunicación efectiva.'], benefits: ['Horario flexible.', 'Presupuesto de formación.', 'Modalidad híbrida.'], skills: ['Node.js', 'React', 'SQL', 'APIs', 'Arquitectura'], publishedAt: '2026-08-10', closingDate: '2026-09-10', featured: true, companyDescription: 'Empresa de tecnología enfocada en productos digitales para América Latina.' },
  2: { companyName: 'Estudio Atlas', companyImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=82', location: 'Heredia, Costa Rica', modality: 'Remoto', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5000, salaryMax: 6200, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Lidera experiencias claras y accesibles para una plataforma de talento.', responsibilities: ['Dirigir investigación de experiencia.', 'Definir flujos y componentes.', 'Acompañar la implementación.'], requirements: ['Portafolio de productos digitales.', 'Experiencia con sistemas de diseño.', 'Conocimiento de accesibilidad.'], benefits: ['Trabajo remoto.', 'Días personales.', 'Equipo para trabajo en casa.'], skills: ['Figma', 'Research', 'UI Design', 'Accesibilidad', 'Prototipado'], publishedAt: '2026-08-12', closingDate: '2026-09-12', featured: true, companyDescription: 'Estudio de producto digital para equipos de personas y operaciones.' },
  3: { companyName: 'Prisma Nube', companyImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=82', location: 'Escazú, Costa Rica', modality: 'Híbrido', contractType: 'Servicios profesionales', experienceLevel: 'Senior', salaryMin: 6500, salaryMax: 8000, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Define una plataforma cloud segura y preparada para alto crecimiento.', responsibilities: ['Diseñar arquitecturas cloud seguras.', 'Definir estándares de observabilidad.', 'Guiar migraciones de infraestructura.'], requirements: ['Experiencia con AWS o GCP.', 'Conocimientos de Kubernetes y Terraform.', 'Práctica en seguridad cloud.'], benefits: ['Proyecto de alto impacto.', 'Horario flexible.', 'Formación especializada.'], skills: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'Seguridad'], publishedAt: '2026-08-14', closingDate: '2026-09-14', featured: true, companyDescription: 'Consultora técnica especializada en plataformas cloud y confiabilidad.' },
  4: { companyName: 'Talento Norte', companyImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=82', location: 'Alajuela, Costa Rica', modality: 'Presencial', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 7000, salaryMax: 9000, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Dirige una estrategia regional de atracción de talento tecnológico.', responsibilities: ['Definir estrategia de atracción.', 'Liderar el equipo de reclutamiento.', 'Dar seguimiento a indicadores.'], requirements: ['Experiencia liderando reclutamiento IT.', 'Dominio de métricas de talento.', 'Negociación con líderes ejecutivos.'], benefits: ['Seguro médico.', 'Bono anual.', 'Plan de desarrollo directivo.'], skills: ['Talent Acquisition', 'Liderazgo', 'Estrategia', 'Entrevistas', 'Métricas'], publishedAt: '2026-08-16', closingDate: '2026-09-16', featured: true, companyDescription: 'Firma regional dedicada a construir equipos tecnológicos en crecimiento.' },
  5: { companyName: 'Vector Datos', companyImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82', location: 'Cartago, Costa Rica', modality: 'Remoto', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5600, salaryMax: 6800, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Crea plataformas de datos confiables para decisiones de negocio.', responsibilities: ['Construir pipelines escalables.', 'Optimizar modelos analíticos.', 'Asegurar calidad de datos.'], requirements: ['Experiencia con Spark y SQL.', 'Conocimiento de Snowflake.', 'Práctica en modelado de datos.'], benefits: ['Trabajo remoto.', 'Bono de conectividad.', 'Capacitación técnica.'], skills: ['Spark', 'Snowflake', 'SQL', 'Python', 'ETL'], publishedAt: '2026-08-18', closingDate: '2026-09-18', featured: false, companyDescription: 'Empresa de analítica de datos para mercados regionales.' },
  6: { companyName: 'Calidad Continua', companyImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=82', location: 'San José, Costa Rica', modality: 'Híbrido', contractType: 'Tiempo completo', experienceLevel: 'Intermedio', salaryMin: 4300, salaryMax: 5500, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Impulsa una cultura de calidad y automatización en productos web.', responsibilities: ['Crear estrategias de automatización.', 'Mantener suites end-to-end.', 'Mejorar procesos de calidad.'], requirements: ['Experiencia con Playwright o Cypress.', 'Conocimiento de CI/CD.', 'Criterio para diseño de pruebas.'], benefits: ['Jornada flexible.', 'Programa de certificaciones.', 'Modalidad híbrida.'], skills: ['Playwright', 'Cypress', 'CI/CD', 'Testing', 'JavaScript'], publishedAt: '2026-08-19', closingDate: '2026-09-19', featured: false, companyDescription: 'Equipo de ingeniería que impulsa la mejora continua de productos digitales.' },
  7: { companyName: 'Horizonte Cloud', companyImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=82', location: 'Santa Ana, Costa Rica', modality: 'Híbrido', contractType: 'Servicios profesionales', experienceLevel: 'Senior', salaryMin: 5400, salaryMax: 6900, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Asegura plataformas resilientes, observables y eficientes.', responsibilities: ['Mejorar confiabilidad de servicios.', 'Automatizar infraestructura.', 'Definir alertas y objetivos de servicio.'], requirements: ['Experiencia en SRE o DevOps.', 'Dominio de Kubernetes y Terraform.', 'Conocimiento de observabilidad.'], benefits: ['Horario flexible.', 'Trabajo híbrido.', 'Plan técnico.'], skills: ['Kubernetes', 'Terraform', 'Observabilidad', 'CI/CD', 'Linux'], publishedAt: '2026-08-20', closingDate: '2026-09-20', featured: false, companyDescription: 'Proveedor de servicios cloud para operaciones críticas.' },
  8: { companyName: 'Lumen Mobile', companyImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=82', location: 'Belén, Costa Rica', modality: 'Presencial', contractType: 'Tiempo completo', experienceLevel: 'Senior', salaryMin: 5700, salaryMax: 7100, currency: 'USD', salaryPeriod: 'por mes', shortDescription: 'Define la arquitectura de experiencias móviles de alta calidad.', responsibilities: ['Definir arquitectura iOS.', 'Mentorear a desarrolladores.', 'Asegurar calidad y rendimiento.'], requirements: ['Experiencia con Swift y SwiftUI.', 'Conocimiento de arquitectura móvil.', 'Experiencia liderando iniciativas.'], benefits: ['Seguro médico.', 'Presupuesto de formación.', 'Facilidades de movilidad.'], skills: ['Swift', 'SwiftUI', 'iOS', 'Arquitectura', 'Mentoría'], publishedAt: '2026-08-21', closingDate: '2026-09-21', featured: false, companyDescription: 'Equipo de producto que crea experiencias móviles para servicios digitales.' }
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
  { id: 1, title: 'Postulación a Senior Fullstack Developer — Perfil Destacado', body: 'Candidato con 8 años de experiencia en desarrollo web moderno, arquitecturas limpias y consumo de servicios RESTful.', userId: 6, vacancyId: 1, createdAt: '2026-08-11', views: 142 },
  { id: 2, title: 'Evaluación Técnica UX/UI Lead Product Designer', body: 'Portfolio auditado con excelencia visual, sistemas de diseño dinámicos y prototipado interactivo avanzado.', userId: 7, vacancyId: 2, createdAt: '2026-08-13', views: 98 },
  { id: 3, title: 'Candidatura Cloud Architect AWS/GCP', body: 'Certificación profesional AWS Solutions Architect, amplia trayectoria en migración cloud e infraestructura como código.', userId: 9, vacancyId: 3, createdAt: '2026-08-15', views: 210 },
  { id: 4, title: 'Requisición Reclutador IT Senior Latam', body: 'Amplia red de contactos en mercado tecnológico de América Latina y España, métricas de retención sobresalientes.', userId: 3, vacancyId: 4, createdAt: '2026-08-17', views: 76 },
  { id: 5, title: 'Postulación a Senior Data Engineer', body: 'Experiencia en pipelines, calidad de datos y modelado analítico para plataformas de inteligencia de mercado.', userId: 8, vacancyId: 5, createdAt: '2026-08-19', views: 54 },
  { id: 6, title: 'Postulación a DevOps & SRE', body: 'Arquitecta DevOps con foco en confiabilidad, observabilidad y automatización de infraestructura.', userId: 9, vacancyId: 7, createdAt: '2026-08-21', views: 41 },
  { id: 7, title: 'Postulación a QA Automation Lead', body: 'Candidato fullstack con interés en calidad, automatización y entrega continua.', userId: 6, vacancyId: 6, createdAt: '2026-08-20', views: 33 },
  { id: 8, title: 'Postulación a Director de Reclutamiento IT', body: 'Consultor senior de talento con experiencia en selección ejecutiva y métricas de contratación.', userId: 2, vacancyId: 4, createdAt: '2026-08-18', views: 61 },
  { id: 9, title: 'Postulación QA Automation', body: 'Experiencia en automatización y calidad continua.', userId: 9, vacancyId: 6, createdAt: '2026-08-22', views: 44 },
  { id: 10, title: 'Postulación DevOps SRE', body: 'Perfil orientado a confiabilidad y plataformas cloud.', userId: 10, vacancyId: 7, createdAt: '2026-08-22', views: 38 },
  { id: 11, title: 'Postulación Mobile iOS', body: 'Arquitectura móvil y liderazgo técnico.', userId: 6, vacancyId: 8, createdAt: '2026-08-23', views: 29 }
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
  const {
    category, modality, location, experienceLevel, contractType,
    workMode, vacancyId, publishedFrom, publishedTo, createdFrom, createdTo, completed
  } = req.query;

  let filtered = list;
  if (q && searchFields.length > 0) {
    filtered = filtered.filter(item =>
      searchFields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }

  if (category) filtered = filtered.filter(item => String(item.category) === String(category));
  if (modality) filtered = filtered.filter(item => String(item.modality) === String(modality));
  if (contractType) filtered = filtered.filter(item => String(item.contractType) === String(contractType));
  if (experienceLevel) filtered = filtered.filter(item => String(item.experienceLevel) === String(experienceLevel));
  if (workMode) filtered = filtered.filter(item => String(item.workMode) === String(workMode));
  if (location) {
    const loc = String(location).toLowerCase();
    filtered = filtered.filter(item => String(item.location || '').toLowerCase().includes(loc));
  }
  if (vacancyId && list.some(item => item.vacancyId !== undefined)) {
    filtered = filtered.filter(item => String(item.vacancyId) === String(vacancyId));
  }
  if (publishedFrom) filtered = filtered.filter(item => !item.publishedAt || String(item.publishedAt) >= String(publishedFrom));
  if (publishedTo) filtered = filtered.filter(item => !item.publishedAt || String(item.publishedAt) <= String(publishedTo));
  if (createdFrom) filtered = filtered.filter(item => !item.createdAt || String(item.createdAt) >= String(createdFrom));
  if (createdTo) filtered = filtered.filter(item => !item.createdAt || String(item.createdAt) <= String(createdTo));
  if (completed === 'true' || completed === 'false') {
    const done = completed === 'true';
    filtered = filtered.filter(item => Boolean(item.completed) === done);
  }

  if (req.query.vacancyId && searchFields.includes('firstName')) {
    const applicantIds = new Set(
      postulaciones.filter(post => String(post.vacancyId) === String(req.query.vacancyId)).map(post => String(post.userId))
    );
    filtered = filtered.filter(item => applicantIds.has(String(item.id)));
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
  const userIdx = USERS_DB.findIndex(u => String(u.id) === String(req.params.id));
  if (userIdx !== -1) {
    USERS_DB[userIdx] = { ...USERS_DB[userIdx], ...req.body };
  }
  res.json(candidatos[idx]);
});

app.patch('/api/users/:id', (req, res) => {
  const idx = candidatos.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Candidato no encontrado' });
  candidatos[idx] = { ...candidatos[idx], ...req.body };
  const userIdx = USERS_DB.findIndex(u => String(u.id) === String(req.params.id));
  if (userIdx !== -1) {
    USERS_DB[userIdx] = { ...USERS_DB[userIdx], ...req.body };
  }
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
  const newObj = {
    id: postulaciones.length + 1,
    views: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    ...req.body
  };
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

function compactCandidate(candidate) {
  return {
    id: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    role: candidate.role,
    skills: candidate.skills,
    about: candidate.about,
    coverLetter: candidate.coverLetter,
    workMode: candidate.workMode,
    yearsOfExperience: candidate.yearsOfExperience,
    location: candidate.location,
    experience: candidate.experience
  };
}

function compactVacancy(vacancy) {
  return {
    id: vacancy.id,
    title: vacancy.title,
    category: vacancy.category,
    skills: vacancy.skills,
    requirements: vacancy.requirements,
    modality: vacancy.modality,
    experienceLevel: vacancy.experienceLevel,
    location: vacancy.location,
    description: vacancy.description,
    shortDescription: vacancy.shortDescription
  };
}

app.post('/api/ai/rank-candidates', async (req, res) => {
  const vacancyId = req.body?.vacancyId;
  const vacancy = vacantes.find(item => String(item.id) === String(vacancyId));
  if (!vacancy) return res.status(400).json({ message: 'Selecciona una vacante válida para ranking de candidatos.' });

  let pool = candidatos;
  if (Array.isArray(req.body?.candidateIds) && req.body.candidateIds.length) {
    const allowed = new Set(req.body.candidateIds.map(String));
    pool = candidatos.filter(item => allowed.has(String(item.id)));
  } else {
    const applicantIds = new Set(
      postulaciones.filter(post => String(post.vacancyId) === String(vacancyId)).map(post => String(post.userId))
    );
    if (applicantIds.size) {
      pool = candidatos.filter(item => applicantIds.has(String(item.id)));
    }
  }

  const result = await rankCandidatesWithAi(compactVacancy(vacancy), pool.map(compactCandidate));
  res.json({
    vacancyId: vacancy.id,
    vacancyTitle: vacancy.title,
    ...result
  });
});

app.post('/api/ai/rank-vacancies', async (req, res) => {
  const candidateId = req.body?.candidateId;
  const candidate = candidatos.find(item => String(item.id) === String(candidateId));
  if (!candidate) return res.status(400).json({ message: 'No se encontró un perfil de candidato para el ranking de vacantes.' });

  const result = await rankVacanciesWithAi(compactCandidate(candidate), vacantes.map(compactVacancy));
  res.json({
    candidateId: candidate.id,
    ...result
  });
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
  console.log(`- OpenRouter IA: ${process.env.OPENROUTER_API_KEY ? 'configurado' : 'sin API key (usa ranking heurístico)'}`);
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
