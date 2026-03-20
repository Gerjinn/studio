
"use client"

import { useState, useMemo } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Ban,
  ShieldCheck,
  ArrowUpDown,
  UserPlus,
  Loader2,
  CheckCircle,
  Settings,
  Save,
  Trash2,
  Filter
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { COLLEGES } from '@/lib/mock-data';

export default function AccountManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const accountsQuery = useMemoFirebase(() => {
    return query(collection(db, 'userProfiles'));
  }, [db]);

  const adminsQuery = useMemoFirebase(() => {
    return query(collection(db, 'roles_admin'));
  }, [db]);

  const { data: accounts, isLoading: isAccountsLoading } = useCollection(accountsQuery);
  const { data: admins, isLoading: isAdminsLoading } = useCollection(adminsQuery);

  const adminUids = useMemo(() => {
    if (!admins) return new Set<string>();
    return new Set(admins.map(a => a.id));
  }, [admins]);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(acc => {
      const matchesSearch = 
        acc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.idNumber.includes(searchTerm) ||
        acc.institutionalEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchesCollege = collegeFilter === 'all' || acc.college === collegeFilter;
      
      return matchesSearch && matchesRole && matchesCollege;
    });
  }, [accounts, searchTerm, roleFilter, collegeFilter]);

  const toggleStatus = (userId: string, currentStatus: string) => {
    const userRef = doc(db, 'userProfiles', userId);
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    updateDocumentNonBlocking(userRef, { accountStatus: newStatus });
    toast({
      title: "Status Updated",
      description: `User account is now ${newStatus}.`,
    });
  };

  const handleToggleAdmin = (userId: string, email: string, currentIsAdmin: boolean) => {
    const adminRef = doc(db, 'roles_admin', userId);

    if (currentIsAdmin) {
      deleteDocumentNonBlocking(adminRef);
      toast({
        title: "Privileges Revoked",
        description: "User is no longer an administrator.",
      });
    } else {
      setDocumentNonBlocking(adminRef, {
        email,
        assignedAt: new Date().toISOString()
      }, { merge: true });
      toast({
        title: "Privileges Granted",
        description: "User has been promoted to administrator.",
      });
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const userRef = doc(db, 'userProfiles', editingUser.id);
    const { id, ...updateData } = editingUser;
    
    updateDocumentNonBlocking(userRef, updateData);
    
    // Sync admin role based on the role selection or explicit toggle
    const currentIsAdmin = adminUids.has(id);
    const shouldBeAdmin = editingUser.role === 'Admin';
    if (shouldBeAdmin !== currentIsAdmin) {
      handleToggleAdmin(id, editingUser.institutionalEmail, currentIsAdmin);
    }
    
    toast({
      title: "Profile Updated",
      description: `${editingUser.fullName}'s profile has been saved.`,
    });
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user profile? This action cannot be undone.')) {
      const userRef = doc(db, 'userProfiles', userId);
      const adminRef = doc(db, 'roles_admin', userId);
      
      deleteDocumentNonBlocking(userRef);
      deleteDocumentNonBlocking(adminRef);
      
      toast({
        variant: "destructive",
        title: "Account Deleted",
        description: "The user profile and associated roles have been removed.",
      });
      setEditingUser(null);
    }
  };

  if (isAccountsLoading || isAdminsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2c38]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#1a2c38]">
      <AdminSidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-white">Account Management</h1>
            <p className="text-muted-foreground">Manage user permissions, account status, and roles.</p>
          </div>
          <Button onClick={() => router.push('/admin/register')} className="gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </header>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or email..." 
              className="pl-9 bg-card border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Filters:</span>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-card border-white/10 text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Faculty">Faculty</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-[220px] bg-card border-white/10 text-white">
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {COLLEGES.map(college => (
                  <SelectItem key={college} value={college}>{college}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(roleFilter !== 'all' || collegeFilter !== 'all' || searchTerm !== '') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setRoleFilter('all');
                  setCollegeFilter('all');
                  setSearchTerm('');
                }}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-card/30 border-white/5">
          <CardHeader className="pb-2 border-b border-white/5">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Total Profiles: {filteredAccounts.length}</CardTitle>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-white/2">
              <TableRow className="border-white/5">
                <TableHead className="text-white font-bold py-5">User Info <ArrowUpDown className="ml-2 h-3 w-3 inline" /></TableHead>
                <TableHead className="text-white font-bold">College</TableHead>
                <TableHead className="text-white font-bold">Role</TableHead>
                <TableHead className="text-white font-bold">Status</TableHead>
                <TableHead className="text-white font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const isAdmin = adminUids.has(account.id) || account.role === 'Admin';
                return (
                  <TableRow key={account.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                          {account.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">
                            {account.fullName} 
                            {isAdmin && <ShieldCheck className="inline h-3 w-3 ml-1 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{account.idNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">{account.college}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/30">
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {account.accountStatus === 'active' ? (
                        <Badge className="bg-green-400/20 text-green-400 border-none">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingUser(account)}
                          className="text-white hover:bg-white/10"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleStatus(account.id, account.accountStatus)}
                          className={account.accountStatus === 'active' ? "text-yellow-500 hover:bg-yellow-500/10" : "text-green-500 hover:bg-green-500/10"}
                        >
                          {account.accountStatus === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="bg-card border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">Account Settings</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={editingUser.fullName} 
                      onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Number</Label>
                    <Input 
                      value={editingUser.idNumber} 
                      onChange={(e) => setEditingUser({...editingUser, idNumber: e.target.value})}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={(v) => setEditingUser({...editingUser, role: v})}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Faculty">Faculty</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>College</Label>
                    <Select 
                      value={editingUser.college} 
                      onValueChange={(v) => setEditingUser({...editingUser, college: v})}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLEGES.map((college) => (
                          <SelectItem key={college} value={college}>
                            {college}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Administrator Privileges</Label>
                    <p className="text-xs text-muted-foreground">Grant access to dashboard and logs</p>
                  </div>
                  <Switch 
                    checked={adminUids.has(editingUser.id) || editingUser.role === 'Admin'} 
                    onCheckedChange={(checked) => handleToggleAdmin(editingUser.id, editingUser.institutionalEmail, !checked)}
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => handleDeleteUser(editingUser.id)}
                    className="text-destructive hover:bg-destructive/10 order-last sm:order-first"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                  <div className="flex gap-2 flex-1 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
