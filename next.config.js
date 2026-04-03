/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config tells Next.js 16 we're fine with Turbopack defaults.
  // We don't need any special browser fallbacks because xrpl.js is only ever
  // imported inside API routes, which run on the server — never in the browser.
  turbopack: {},
};

module.exports = nextConfig;
