const isGithubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isGithubPages ? "/future-camera-lab" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  images: {
    unoptimized: true
  },
  ...(isGithubPages ? { output: "export" } : {})
};

export default nextConfig;
