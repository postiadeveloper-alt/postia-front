const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${BACKEND_URL}/api/:path*`,
            },
            {
                source: '/auth/:path*',
                destination: `${BACKEND_URL}/auth/:path*`,
            },
        ];
    },
};

export default nextConfig;
