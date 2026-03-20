
"use client"

import { useState, useMemo } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  School,
  Activity,
  Loader2,
  Trash2,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { COLLEGES } from '@/lib/mock-data';
import { exportToExcel } from '@/lib/export-utils';

export default function VisitorLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const db = useFirestore();
  const { toast } = useToast();

  const visitsQuery = useMemoFirebase(() => {
    return query(collection(db, 'visitLogs'), orderBy('entryTime', 'desc'));
  }, [db]);

  const { data: visits, isLoading } = useCollection(visitsQuery);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    return visits.filter(v => {
      const matchesSearch = 
        v.visitorFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.visitorIdNumber?.includes(searchTerm) ||
        v.visitorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || v.visitorRole === roleFilter;
      const matchesCollege = collegeFilter === 'all' || v.visitorCollege === collegeFilter;
      
      return matchesSearch && matchesRole && matchesCollege;
    });
  }, [visits, searchTerm, roleFilter, collegeFilter]);

  const confirmDeleteLog = () => {
    if (!logToDelete) return;
    
    setIsDeleting(true);
    const logRef = doc(db, 'visitLogs', logToDelete.id);
    deleteDocumentNonBlocking(logRef);
    
    toast({
      variant: "destructive",
      title: "Log Deleted",
      description: "The visit record has been permanently removed.",
    });
    
    setLogToDelete(null);
    setTimeout(() => setIsDeleting(false), 500);
  };

  const handleExport = () => {
    if (!filteredVisits || filteredVisits.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "No data available to export.",
      });
      return;
    }

    const exportData = filteredVisits.map(v => ({
      'Visitor Name': v.visitorFullName,
      'ID Number': v.visitorIdNumber,
      'Email': v.visitorEmail,
      'Role': v.visitorRole,
      'College': v.visitorCollege,
      'Purpose': v.categorizedPurpose || v.purpose,
      'Date': v.entryTime ? format(parseISO(v.entryTime), 'MMMM d, yyyy') : 'N/A',
      'Time': v.entryTime ? format(parseISO(v.entryTime), 'h:mm a') : 'N/A',
    }));

    exportToExcel(exportData, `NEU_Library_VisitorLog_${format(new Date(), 'yyyy-MM-dd')}`);
    
    toast({
      title: "Export Success",
      description: "Excel file has been generated.",
    });
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
            <h1 className="text-3xl font-bold font-headline text-white">Visitor Log</h1>
            <p className="text-muted-foreground">Complete history of all library visits.</p>
          </div>
          <Button onClick={handleExport} className="gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </header>

        <Card className="bg-card/30 border-white/5 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Name, ID, or Email..." 
                  className="pl-9 bg-card border-white/10 text-white"
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
                    <SelectItem value="Student">Students</SelectItem>
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
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Showing {filteredVisits.length} Records
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-white/2 hover:bg-transparent">
              <TableRow className="border-white/5">
                <TableHead className="text-white font-bold py-5">Visitor</TableHead>
                <TableHead className="text-white font-bold">Email</TableHead>
                <TableHead className="text-white font-bold">Role & College</TableHead>
                <TableHead className="text-white font-bold">Reason for Visit</TableHead>
                <TableHead className="text-white font-bold">Time In</TableHead>
                <TableHead className="text-white font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((v) => (
                <TableRow key={v.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {v.visitorFullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{v.visitorFullName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground uppercase font-medium">{v.visitorIdNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{v.visitorEmail}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit border-primary/30 text-primary text-[10px] py-0">{v.visitorRole}</Badge>
                      <div className="flex items-center gap-1 text-[11px] text-white/70 font-bold">
                        <School className="h-3 w-3 text-secondary" /> {v.visitorCollege}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-secondary/20 text-secondary border-none font-bold">
                      {v.categorizedPurpose || v.purpose}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-white font-medium">{v.entryTime ? format(parseISO(v.entryTime), 'h:mm a') : 'N/A'}</p>
                    <p className="text-[10px] text-muted-foreground">{v.entryTime ? format(parseISO(v.entryTime), 'MMMM d, yyyy') : ''}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLogToDelete(v)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && !isDeleting && setLogToDelete(null)}>
          <AlertDialogContent className="bg-card border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Permanent Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/70 text-base">
                Are you sure you want to delete the visit record for <span className="font-bold text-white">{logToDelete?.visitorFullName}</span>? 
                This entry will be <span className="text-destructive font-black underline">PERMANENTLY</span> removed from the historical log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteLog}
                className="bg-destructive text-white hover:bg-destructive/90 font-bold"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Record"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
