import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ProfessionalSessionProvider } from "@/components/ProfessionalSession";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "LEX SUPERMUS | Where Law Meets Intelligence",
  description:
    "Access legal support, knowledge, and AI-assisted tools through the LEX SUPERMUS client platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ProfessionalSessionProvider>
          <SiteHeader />
          <main>
            {children}
            <SiteFooter />
          </main>
        </ProfessionalSessionProvider>
      </body>
    </html>
  );
}
