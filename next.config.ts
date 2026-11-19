import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Dev only: allow opening `npm run dev` from other devices on the home
  // network (e.g. http://192.168.x.x:3000). Without this, Next blocks the
  // dev chunks, HMR and lazily loaded code such as the STL viewer.
  allowedDevOrigins: ["192.168.*.*"],
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
