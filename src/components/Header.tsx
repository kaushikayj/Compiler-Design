
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { LogIn, LogOut, UserPlus, Code, History } from 'lucide-react'; // Import icons


export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error display (e.g., using a toast notification)
    }
  };

  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Code className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Code Insights</h1>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
         {user && (
           <Link href="/history" passHref>
             <Button variant="ghost" size="sm">
                <History className="mr-2 h-4 w-4" /> History
             </Button>
           </Link>
         )}
          {user ? (
            <Button onClick={handleLogout} variant="outline" size="sm">
               <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button variant="default" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
