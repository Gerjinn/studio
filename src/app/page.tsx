import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LogIn, UserCircle } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center neu-gradient">
      <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Logo className="w-32 h-32 mb-6 shadow-2xl shadow-primary/20" />
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl font-headline">
          Welcome to <span className="text-primary">NEU Library!</span>
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-lg">
          Official Library Visitor Log of New Era University. Please sign in to log your visit.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Button asChild size="lg" className="h-16 px-10 text-xl font-semibold shadow-lg hover:scale-105 transition-transform">
          <Link href="/visit">
            <UserCircle className="mr-2 h-6 w-6" />
            Visitor Log
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-16 px-10 text-xl font-semibold border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-transform">
          <Link href="/admin/login">
            <LogIn className="mr-2 h-6 w-6" />
            Admin Login
          </Link>
        </Button>
      </div>

      <footer className="absolute bottom-8 text-white/40 text-sm">
        © {new Date().getFullYear()} New Era University Library. All rights reserved.
      </footer>
    </div>
  );
}
