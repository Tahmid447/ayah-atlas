import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingIncludes: { "/api/[...path]": ["./data/corpus.sqlite"] },
  async redirects() { return [{ source: "/famous", destination: "/famous/index.html", permanent: false }]; },
  async headers() { return [{source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache"}]},{ source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ] }]; },
};
export default config;
