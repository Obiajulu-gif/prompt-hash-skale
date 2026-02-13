import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "Provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "PromptHash on SKALE",
  description:
    "Prompt marketplace on SKALE with paid premium AI routes, x402, and CDP embedded wallets.",
  icons: "/images/logo.png",
  openGraph: {
    title: "PromptHash on SKALE",
    description:
      "Explore a curated collection of top creator prompts for images, text & code generation.",
    url: "https://prompthash.example.com",
    siteName: "PromptHash on SKALE",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@prompthash",
    creator: "@prompthash",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Provider>
      <body className="min-h-screen bg-gray-950 antialiased selection:bg-primary/20 selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
      </Provider>
    </html>
  );
}
