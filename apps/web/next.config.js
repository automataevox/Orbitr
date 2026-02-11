/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ["@orbitr/core", "@orbitr/database", "@orbitr/types"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { isServer }) => {
    // Externalize server-only packages to avoid bundling issues
    if (isServer) {
      const existingExternals = config.externals;
      config.externals = [
        // Keep existing externals (important for Next.js internal packages)
        ...(Array.isArray(existingExternals) ? existingExternals : [existingExternals]).filter(Boolean),
        // Add our server-only packages
        {
          'cpu-features': 'commonjs cpu-features',
          'ssh2': 'commonjs ssh2',
          'dockerode': 'commonjs dockerode',
        },
        // Externalize Prisma client to prevent bundling binary files
        function ({ request }, callback) {
          if (/^@prisma\/client(\/.*)?$/.test(request) || /^\.prisma\/client(\/.*)?$/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        },
      ];
    }

    // Fix for dockerode and native modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        'cpu-features': false,
      };
    }

    // Ignore optional native modules
    config.plugins = config.plugins || [];
    config.ignoreWarnings = [
      { module: /node_modules\/cpu-features/ },
      { module: /node_modules\/ssh2/ },
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
