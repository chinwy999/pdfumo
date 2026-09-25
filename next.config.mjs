/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL("./", import.meta.url).pathname,

  turbopack: {
    root: new URL("./", import.meta.url).pathname,
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
