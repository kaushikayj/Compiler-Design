
import Header from '@/components/Header';
import CodeAnalyzer from '@/components/CodeAnalyzer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <CodeAnalyzer />
      </main>
       <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Code Insights. All rights reserved.
      </footer>
    </div>
  );
}
