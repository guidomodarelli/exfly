import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["beez-ui"],
  typescript: {
    // El chequeo de tipos corre como gate aparte vía `npm run typecheck`,
    // así el build no vuelve a pagar el costo de `tsc` (~20s).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
