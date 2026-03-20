
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@neu.edu.ph')) return;

    setIsLoading(true);
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/admin/dashboard');
  };

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
              <label className="text-sm font-medium text-white/80">NEU Admin Email</label>
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

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold"
              disabled={!email.includes('@neu.edu.ph') || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Secure Login'
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/80 leading-relaxed">
            <p className="font-bold mb-1 uppercase tracking-wider text-yellow-500">Notice</p>
            Unauthorized access attempts are logged and reported to the NEU IT Department.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
