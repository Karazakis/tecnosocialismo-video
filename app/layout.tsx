import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video | Tecnosocialismo",
  description: "Video, conoscenza e cultura senza pubblicità, sorveglianza o algoritmi opachi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
