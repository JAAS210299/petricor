import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Aquí puedes añadir otras opciones de Next.js en el futuro */
  experimental: {
    // Esto le dice a Next.js que optimice los iconos de lucide y no sature la memoria RAM
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;