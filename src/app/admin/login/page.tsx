
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@neu.edu.ph')) {
      toast({
        variant: "destructive",
        title: "Invalid Domain",
        description: "Please use your @neu.edu.ph institutional email.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center neu-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center neu-gradient p-4">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="text-white/70">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Welcome
        </Button>
      </div>

      <Card className="w-full max-w-md bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-20 h-20 shadow-xl shadow-primary/10" />
          </div>
          <CardTitle className="text-3xl font-bold text-white font-headline">Admin Access</CardTitle>
          <CardDescription className="text-white/60">
            Sign in with your administrator institutional account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">NEU Email</label>
              <Input
                type="email"
                placeholder="admin.name@neu.edu.ph"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary"
              />
              {email && !email.includes('@neu.edu.ph') && (
                <p className="text-destructive text-xs font-medium flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Requires @neu.edu.ph domain
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold"
              disabled={!email.includes('@neu.edu.ph') || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Secure Login'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Don't have an account?{' '}
              <Link href="/admin/register" className="text-primary hover:underline font-bold">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/80 leading-relaxed">
            <p className="font-bold mb-1 uppercase tracking-wider text-yellow-500">Notice</p>
            Unauthorized access attempts are logged and reported to the NEU IT Department.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
