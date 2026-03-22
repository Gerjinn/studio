
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /**
   * Comprehensive authorization check:
   * 1. Checks roles_admin for staff privileges.
   * 2. Checks userProfiles for accountStatus (Blocking logic).
   */
  const verifyAuthorization = async (uid: string, userEmail: string | null) => {
    const normalizedEmail = userEmail?.toLowerCase() || '';
    
    // Fallback for master administrator
    if (normalizedEmail === 'gerjinn.yallung@neu.edu.ph') return true;
    
    // Check if account is blocked in userProfiles
    const profilesRef = collection(db, 'userProfiles');
    const profileQuery = query(profilesRef, where('institutionalEmail', '==', normalizedEmail), limit(1));
    const profileSnap = await getDocs(profileQuery);
    
    if (!profileSnap.empty) {
      const profile = profileSnap.docs[0].data();
      if (profile.accountStatus === 'blocked') {
        return false; // Blocked accounts can't access dashboard even if they are staff
      }
    }
    
    // Check staff permissions
    const adminRef = doc(db, 'roles_admin', uid);
    const snap = await getDoc(adminRef);
    return snap.exists();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!normalizedEmail.endsWith('@neu.edu.ph')) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only @neu.edu.ph institutional accounts are permitted.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const authorized = await verifyAuthorization(result.user.uid, result.user.email);
      
      if (!authorized) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "This account is either unauthorized or has been suspended by an administrator.",
        });
      } else {
        // Mark that we just logged in for the welcome animation
        sessionStorage.setItem('just_logged_in', 'true');
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials or account restriction.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const normalizedEmail = user.email?.toLowerCase() || '';

      if (!normalizedEmail.endsWith('@neu.edu.ph')) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only @neu.edu.ph institutional Google accounts are permitted.",
        });
        return;
      }

      const authorized = await verifyAuthorization(user.uid, normalizedEmail);
      if (!authorized) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "Your dashboard access has been suspended or unauthorized.",
        });
        return;
      }

      sessionStorage.setItem('just_logged_in', 'true');
      router.push('/admin/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "Domain Not Authorized",
          description: "This domain is not authorized for authentication. Please add it to the 'Authorized domains' list in the Firebase Console.",
        });
      } else if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Could not sign in with Google.",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2c38]">
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
          <CardTitle className="text-3xl font-bold text-white font-headline">Admin Portal</CardTitle>
          <CardDescription className="text-white/60">
            Secure access for NEU Library Authorized Staff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full h-12 bg-white text-black hover:bg-gray-100 border-none flex items-center justify-center gap-3 font-bold"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Sign in with Google
          </Button>

          <div className="flex items-center gap-4 py-2">
            <Separator className="flex-1 bg-white/10" />
            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">or</span>
            <Separator className="flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Institutional Email</label>
              <Input
                type="email"
                placeholder="admin.name@neu.edu.ph"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/20 border-white/10 text-white h-12 pr-12 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-12 text-white/40 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold"
              disabled={!email.includes('@neu.edu.ph') || isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Secure Login'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/80 leading-relaxed text-center">
            Authorized Personnel Only. Access requires explicit administrative enrollment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
