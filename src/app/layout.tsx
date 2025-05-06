import type { Metadata } from 'next';
// Use Geist Sans & Mono if preferred, or stick with Inter
// import { Geist, Geist_Mono } from 'next/font/google';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';

// Option 1: Using Geist Sans and Mono
// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });
// const fontVariables = `${geistSans.variable} ${geistMono.variable}`;

// Option 2: Using Inter (as currently implemented)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Add variable for potential use
const fontVariables = `${inter.variable}`;
const fontClassName = inter.className; // Use className directly for body

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
      {/* Apply font variables to html tag if needed, or directly to body */}
      {/* <body className={`${fontVariables} antialiased`}> */}
      <body className={`${fontClassName} antialiased`}> {/* Using Inter className */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
