
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
  Filter,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert
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
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser, useAuth } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { COLLEGES } from '@/lib/mock-data';

export default function AccountManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const db = useFirestore();
  const auth = useAuth();
  const { user: currentUser, isUserLoading } = useUser();
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
      const name = acc.fullName || '';
      const idNum = acc.idNumber || '';
      const email = acc.institutionalEmail || '';
      const role = acc.role || '';
      const college = acc.college || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idNum.includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.toLowerCase().includes(searchTerm.toLowerCase());
      
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
        description: "User no longer has dashboard access.",
      });
    } else {
      setDocumentNonBlocking(adminRef, {
        email,
        assignedAt: new Date().toISOString()
      }, { merge: true });
      toast({
        title: "Privileges Granted",
        description: "User now has dashboard access.",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Handle Manual Password Update if provided
    if (newPassword) {
      setIsUpdatingPassword(true);
      try {
        // NOTE: Firebase Client SDK can only update the password of the CURRENTLY logged in user.
        // To update another user's password, an admin reset link or Firebase Console is typically required.
        if (editingUser.id === currentUser?.uid) {
          await updatePassword(auth.currentUser!, newPassword);
          toast({
            title: "Password Updated",
            description: "Your administrative password has been changed.",
          });
        } else {
          // Since Client SDK cannot change another user's password directly:
          toast({
            variant: "destructive",
            title: "Manual Reset Unavailable",
            description: "For security, direct password overwrites for other users must be done in the Firebase Console.",
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Could not update password.",
        });
      } finally {
        setIsUpdatingPassword(false);
        setNewPassword('');
      }
    }

    const userRef = doc(db, 'userProfiles', editingUser.id);
    const { id, ...updateData } = editingUser;
    
    updateDocumentNonBlocking(userRef, updateData);
    
    const currentHasStaffAccess = adminUids.has(id);
    const shouldHaveStaffAccess = editingUser.role === 'Admin' || editingUser.role === 'Employee';
    
    if (shouldHaveStaffAccess !== currentHasStaffAccess) {
      handleToggleAdmin(id, editingUser.institutionalEmail, currentHasStaffAccess);
    }
    
    toast({
      title: "Profile Updated",
      description: `${editingUser.fullName}'s profile has been saved.`,
    });
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!userToDelete || !currentUser) return;

    if (userToDelete.id === currentUser.uid) {
      toast({
        variant: "destructive",
        title: "Action Denied",
        description: "You cannot delete your own administrative account.",
      });
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    const userRef = doc(db, 'userProfiles', userToDelete.id);
    const adminRef = doc(db, 'roles_admin', userToDelete.id);
    
    deleteDocumentNonBlocking(userRef);
    deleteDocumentNonBlocking(adminRef);
    
    toast({
      variant: "destructive",
      title: "Account Permanently Deleted",
      description: "The user profile and all permissions have been removed.",
    });
    
    setEditingUser(null);
    setUserToDelete(null);
    setTimeout(() => setIsDeleting(false), 500);
  };

  if (isAccountsLoading || isAdminsLoading || isUserLoading) {
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
              placeholder="Search by name, ID, email, role, or college..." 
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
                const hasStaffAccess = adminUids.has(account.id);
                const isSelf = account.id === currentUser?.uid;
                return (
                  <TableRow key={account.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                          {account.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">
                            {account.fullName} 
                            {hasStaffAccess && <ShieldCheck className="inline h-3 w-3 ml-1 text-primary" />}
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
                          onClick={() => {
                            setEditingUser(account);
                            setNewPassword('');
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleStatus(account.id, account.accountStatus)}
                          disabled={isSelf}
                          className={account.accountStatus === 'active' ? "text-yellow-500 hover:bg-yellow-500/10" : "text-green-500 hover:bg-green-500/10"}
                        >
                          {account.accountStatus === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setUserToDelete(account)}
                          disabled={isSelf}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && !isDeleting && setEditingUser(null)}>
          <DialogContent className="bg-card border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">Account Settings</DialogTitle>
              <DialogDescription className="text-white/60">
                Update user information or manage permissions.
              </DialogDescription>
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
                    <Label className="text-base font-bold">Dashboard Access</Label>
                    <p className="text-xs text-muted-foreground">Allow login to Admin Portal</p>
                  </div>
                  <Switch 
                    checked={adminUids.has(editingUser.id)} 
                    onCheckedChange={(checked) => handleToggleAdmin(editingUser.id, editingUser.institutionalEmail, !checked)}
                  />
                </div>

                {/* Manual Password Override Section */}
                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-3">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Security & Access
                    </Label>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                      <div className="space-y-2">
                        <Label>New Manual Password</Label>
                        <div className="relative">
                          <Input 
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Type to override password..."
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-black/20 border-white/10 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10 text-white/40 hover:text-white"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3">
                    <div className="flex items-center gap-2 text-destructive font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Danger Zone</span>
                    </div>
                    <p className="text-xs text-destructive-foreground/80 leading-relaxed">
                      Deleting this account will permanently remove the user's profile and all administrative access.
                    </p>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => setUserToDelete(editingUser)}
                      disabled={editingUser.id === currentUser?.uid || isDeleting}
                      className="w-full gap-2 font-bold"
                    >
                      <Trash2 className="h-4 w-4" />
                      Permanently Delete Account
                    </Button>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !isDeleting && setUserToDelete(null)}>
          <AlertDialogContent className="bg-card border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Permanent Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/70 text-base">
                Are you absolutely sure you want to delete <span className="font-bold text-white">{userToDelete?.fullName}</span>? 
                This action is <span className="text-destructive font-black underline">PERMANENT</span> and will remove all profile data and administrative privileges forever.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-white hover:bg-destructive/90 font-bold"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
