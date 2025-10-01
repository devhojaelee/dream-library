import type { Metadata } from "next";
import "./globals-eink.css";

export const metadata: Metadata = {
  title: "Dream Library - E-Reader Mode",
  description: "E-ink 디스플레이 최적화 버전",
};

export default function EinkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
