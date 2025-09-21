/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',          // ← これが重要
  images: { unoptimized: true }, // 画像最適化を無効化（export用）
};

module.exports = nextConfig;
