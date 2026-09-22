import type { NextConfig } from "next";

const basePathValue = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/^\/+|\/+$/g, "");
const basePath = basePathValue ? `/${basePathValue}` : "";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    useTypeScriptCli: false,
  },
  // Type checking runs explicitly in CI/local verification. The Next 16 build
  // worker does not forward diagnostics correctly in this environment.
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
