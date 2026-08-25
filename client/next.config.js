const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@xyflow/react'],
  outputFileTracingRoot: path.join(__dirname, '../')
};

module.exports = nextConfig;
