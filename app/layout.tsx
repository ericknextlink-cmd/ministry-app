import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ApplicationProvider } from "@/contexts/ApplicationContext";


const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ministry of Works, Housing & Water Resources",
  description: "Official portal for Classification Certificate Application",
  icons: {
    icon: "/ministry-1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <ApplicationProvider>
            {children}
            <Toaster />
          </ApplicationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
