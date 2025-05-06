
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin'; // Use firebase-admin for server-side auth check

// Initialize Firebase Admin SDK (ensure this runs only once)
// You might place this initialization logic elsewhere if needed, e.g., in a separate config file.
// Important: Ensure your service account key JSON is securely managed and available as an environment variable.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of paths that require authentication
  const protectedPaths = ['/history'];

  // Check if the current path requires authentication
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('firebaseIdToken')?.value; // Assuming you store the ID token in a cookie named 'firebaseIdToken'

    if (!token) {
      // No token found, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: Pass redirect info
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the token using Firebase Admin SDK
      // This requires the Admin SDK to be initialized
      await auth().verifyIdToken(token);
      // Token is valid, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // Token verification failed (invalid or expired token)
      console.error('Middleware Auth Error:', error);
      // Clear the potentially invalid cookie and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
       const response = NextResponse.redirect(loginUrl);
       // Clear the cookie
       response.cookies.set('firebaseIdToken', '', { maxAge: -1 }); // Or response.cookies.delete('firebaseIdToken');
      return response;
    }
  }

  // For public paths, allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/history/:path*'], // Apply middleware only to /history and its subpaths
};

