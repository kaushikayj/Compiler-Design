
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] }); // Simplified: removed variable assignment as it's not used for className

export const metadata: Metadata = {
  title: 'Code Insights - Compiler Design Toolkit',
  description: 'Tokenize code, generate intermediate representations, and manage your analysis history.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}> {/* Directly use inter.className */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
