import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '512mb', // Set request body size limit to 512 MB
    },
    responseLimit: '512mb', // Set response size limit to 512 MB
  },
};

export default nextConfig;
