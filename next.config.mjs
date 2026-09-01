/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL("./", import.meta.url).pathname,
  turbopack: {
    root: new URL("./", import.meta.url).pathname,
  },
};

export default nextConfig;
