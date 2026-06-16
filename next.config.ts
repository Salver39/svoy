import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрываем dev-indicator (круглую пилюлю в углу).
  // Ошибки сборки/рантайма Next всё равно покажет.
  devIndicators: false,
};

export default nextConfig;
