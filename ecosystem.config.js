// MoraBanc Office Store — configuración de PM2 para producción.
//
// Apunta directamente al servidor standalone que genera `next build`
// (`next.config.ts` tiene `output: "standalone"`), no a `next start`: es
// la opción más ligera y la pensada para correr como servicio sin
// depender de todo node_modules en el servidor.
//
// Uso: pm2 startOrReload ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: "morabanc-office-store",
      script: "server.js",
      cwd: "./.next/standalone",
      // Un solo proceso: esta app es una herramienta interna de
      // MoraBanc, no hace falta escalado horizontal. Aumentar
      // `instances` solo si el tráfico real lo justifica.
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
        // Solo localhost: IIS es quien expone el sitio a Internet
        // (reverse proxy). El proceso Node no debe escuchar en ninguna
        // interfaz pública directamente.
        HOSTNAME: "127.0.0.1",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      // En los servidores Windows, PM2 escribe los logs en
      // %HOME%\.pm2\logs por defecto; se puede sobreescribir aquí si IT
      // prefiere otra ubicación.
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};
