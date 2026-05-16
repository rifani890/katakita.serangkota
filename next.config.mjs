const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    // Note: 'unsafe-inline' is required by Next.js 14 for dev and dynamic styles/scripts.
    // 'unsafe-eval' is required by Next.js during development for React Fast Refresh.
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Force HTTPS in production (handled by most hosting providers, but this is a safety net)
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/:path*",
          has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
          destination: "https://katakita-serangkota.vercel.app/:path*",
          permanent: true,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
