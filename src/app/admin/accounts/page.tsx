
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
  CheckCircle
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
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AccountManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  const router = useRouter();

  const accountsQuery = useMemoFirebase(() => {
    return query(collection(db, 'userProfiles'));
  }, [db]);

  const { data: accounts, isLoading } = useCollection(accountsQuery);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(acc => 
      acc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.idNumber.includes(searchTerm) ||
      acc.college.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const toggleStatus = (userId: string, currentStatus: string) => {
    const userRef = doc(db, 'userProfiles', userId);
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    updateDocumentNonBlocking(userRef, { accountStatus: newStatus });
  };

  if (isLoading) {
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
            <p className="text-muted-foreground">Manage user permissions and account status.</p>
          </div>
          <Button onClick={() => router.push('/admin/register')} className="gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" />
            Register Account
          </Button>
        </header>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or college..." 
              className="pl-9 bg-card border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px] bg-card border-white/10 text-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Faculty">Faculty</SelectItem>
              <SelectItem value="Employee">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card/30 border-white/5">
          <CardHeader className="pb-2 border-b border-white/5">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Total Profiles: {filteredAccounts.length}</CardTitle>
              <p className="text-xs text-muted-foreground">Manage student, staff and faculty access</p>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-white/2">
              <TableRow className="border-white/5">
                <TableHead className="text-white font-bold py-5">User Info <ArrowUpDown className="ml-2 h-3 w-3 inline" /></TableHead>
                <TableHead className="text-white font-bold">College <ArrowUpDown className="ml-2 h-3 w-3 inline" /></TableHead>
                <TableHead className="text-white font-bold">Type</TableHead>
                <TableHead className="text-white font-bold">Status</TableHead>
                <TableHead className="text-white font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                        {account.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{account.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{account.idNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{account.institutionalEmail}</p>
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
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-destructive text-xs font-bold uppercase tracking-wider">
                        <Ban className="h-3 w-3" /> Blocked
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleStatus(account.id, account.accountStatus)}
                      className={account.accountStatus === 'active' ? "text-yellow-500 hover:bg-yellow-500/10" : "text-green-500 hover:bg-green-500/10"}
                      title={account.accountStatus === 'active' ? "Block User" : "Unblock User"}
                    >
                      {account.accountStatus === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
