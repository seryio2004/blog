import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    useTypeScriptCli: false,
    // Spanish and English use separate root layouts so each page ships the
    // correct <html lang>; the shared 404 lives in app/global-not-found.tsx.
    globalNotFound: true,
  },
  // Type checking runs explicitly in CI/local verification. The Next 16 build
  // worker does not forward diagnostics correctly in this environment.
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
