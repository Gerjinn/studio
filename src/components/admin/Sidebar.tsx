
"use client"

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { LayoutDashboard, ClipboardList, Users, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Visitor Log', href: '/admin/logs', icon: ClipboardList },
  { label: 'Account Management', href: '/admin/accounts', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  // Bootstrap logic for the main administrator only
  useEffect(() => {
    const BOOTSTRAP_ADMIN = 'gerjinn.yallung@neu.edu.ph';
    const normalizedUserEmail = user?.email?.toLowerCase().trim();
    
    if (!isUserLoading && user && normalizedUserEmail === BOOTSTRAP_ADMIN) {
      const profileRef = doc(db, 'userProfiles', user.uid);
      const adminRef = doc(db, 'roles_admin', user.uid);
      
      // Idempotent bootstrap: Ensure both profile and admin record exist for the master account
      setDocumentNonBlocking(profileRef, {
        id: user.uid,
        institutionalEmail: BOOTSTRAP_ADMIN,
        fullName: user.displayName || 'Main Administrator',
        idNumber: 'ADMIN-MASTER',
        role: 'Admin',
        college: 'Administration',
        accountStatus: 'active',
        createdAt: new Date().toISOString()
      }, { merge: true });

      setDocumentNonBlocking(adminRef, {
        email: BOOTSTRAP_ADMIN,
        assignedAt: new Date().toISOString(),
        isMaster: true
      }, { merge: true });
    }
  }, [user, isUserLoading, db]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-4">
        <Logo className="w-12 h-12 shadow-lg shadow-black/20" />
        <div>
          <h2 className="text-lg font-bold text-white font-headline leading-tight">NEU Library</h2>
          <p className="text-xs text-primary font-medium tracking-widest uppercase">Admin Portal</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border/50 mx-6 w-auto" />

      <nav className="flex-1 px-4 py-8 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground")} />
              <span className="font-semibold">{item.label}</span>
              {isActive && (
                <div className="ml-auto">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-sidebar-accent/50 rounded-2xl p-4 mb-4 border border-sidebar-border/50">
          <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Current Session</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate" title={user?.email || 'Not signed in'}>
            {user?.email || 'Loading...'}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 border-white/5 bg-white/5 hover:bg-destructive hover:text-white transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
