import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/pages/login/login.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard/dashboard.html'),
        candidatos: resolve(__dirname, 'src/pages/candidatos/candidatos.html'),
        vacantes: resolve(__dirname, 'src/pages/vacantes/vacantes.html'),
        empresas: resolve(__dirname, 'src/pages/empresas/empresas.html'),
        postulaciones: resolve(__dirname, 'src/pages/postulaciones/postulaciones.html'),
        entrevistas: resolve(__dirname, 'src/pages/entrevistas/entrevistas.html'),
        tareas: resolve(__dirname, 'src/pages/tareas/tareas.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
