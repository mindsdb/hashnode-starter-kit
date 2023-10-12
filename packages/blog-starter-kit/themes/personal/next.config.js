const isProd = process.env.NEXT_PUBLIC_MODE === "production";
const ANALYTICS_BASE_URL = "https://hn-ping2.hashnode.com";
const ADVANCED_ANALYTICS_BASE_URL = "https://stats.hashnode.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const getAssetPrefix = () => {
  if (BASE_URL) {
    return `${isProd ? "https://" : "http://"}${BASE_URL}`;
  }
  return "/";
};

const getBasePath = () => {
  if (!BASE_URL) { 
    return undefined;
  }
  else if (BASE_URL.indexOf("/") !== -1) {
    return BASE_URL.substring(BASE_URL.indexOf("/"));
  }
  return undefined;
};

/**
 * @type {import('next').NextConfig}
 */
const config = {
  transpilePackages: ["@starter-kit/utils"],
  assetPrefix: getAssetPrefix(),
  basePath: getBasePath(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ping/data-event",
        destination: `${ANALYTICS_BASE_URL}/api/data-event`,
      },
      {
        source: "/ping/view",
        destination: `${ANALYTICS_BASE_URL}/api/view`,
      },
      {
        source: "/api/collect",
        destination: `${ADVANCED_ANALYTICS_BASE_URL}/api/collect`,
      },
    ];
  },
};

module.exports = config;