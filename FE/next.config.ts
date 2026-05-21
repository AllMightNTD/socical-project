/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['10.10.0.224', 'localhost', '127.0.0.1'],
  images: {
    dangerouslyAllowSVG: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
