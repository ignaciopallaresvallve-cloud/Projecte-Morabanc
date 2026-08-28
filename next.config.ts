import type { NextConfig } from "next";

function supabaseImageRemotePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  try {
    const { hostname } = new URL(supabaseUrl);
    return [
      {
        protocol: "https" as const,
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Empaqueta un servidor mínimo (server.js) con solo las dependencias que
  // se usan de verdad en runtime, en vez de exigir todo node_modules (505MB
  // en este proyecto) en el servidor de producción. Es lo que hace viable
  // desplegar esto como servicio de Windows gestionado por PM2/NSSM: se
  // compila una vez y se copia .next/standalone al servidor, sin necesitar
  // `npm ci` ahí.
  output: "standalone",
  // No revela la cabecera "X-Powered-By: Next.js" en las respuestas.
  poweredByHeader: false,
  // Fija la raíz del proyecto explícitamente: sin esto, Turbopack detecta
  // un package-lock.json en el directorio home del usuario (por encima de
  // este proyecto) y no sabe cuál es la raíz real.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: supabaseImageRemotePattern(),
  },
  // El límite por defecto de las Server Actions (1MB) es menor que el
  // máximo de imagen de producto que ya validamos en admin/actions.ts (5MB).
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
