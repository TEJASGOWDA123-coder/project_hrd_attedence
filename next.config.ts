import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        // @ts-ignore
        instrumentationHook: true
    }
};

export default nextConfig;
