
"use client"

import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  School,
  Activity
} from 'lucide-react';
import { MOCK_VISITORS } from '@/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function VisitorLogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen flex bg-[#1a2c38]">
      <AdminSidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-white">Visitor Log</h1>
            <p className="text-muted-foreground">Complete history of all library visits.</p>
          </div>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </header>

        <Card className="bg-card/30 border-white/5 mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Name, ID, or Email..." 
                  className="pl-9 bg-card border-white/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select>
                <SelectTrigger className="bg-card border-white/10 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-card border-white/10 text-white">
                  <SelectValue placeholder="Filter by Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bsit">BSIT</SelectItem>
                  <SelectItem value="bscs">BSCS</SelectItem>
                  <SelectItem value="bsn">BSN</SelectItem>
                  <SelectItem value="bsme">BSME</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10 bg-card gap-2 text-white">
                  <CalendarIcon className="h-4 w-4" /> Custom Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Showing {MOCK_VISITORS.length} Visitors
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-primary text-white border-primary">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-white/2 hover:bg-transparent">
              <TableRow className="border-white/5">
                <TableHead className="text-white font-bold py-5">Visitor</TableHead>
                <TableHead className="text-white font-bold">Email</TableHead>
                <TableHead className="text-white font-bold">Role & Dept</TableHead>
                <TableHead className="text-white font-bold">Reason for Visit</TableHead>
                <TableHead className="text-white font-bold">Time In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_VISITORS.map((v) => (
                <TableRow key={v.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {v.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{v.name}</p>
                        <p className="text-xs text-muted-foreground uppercase font-medium">{v.idNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{v.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit border-primary/30 text-primary text-[10px] py-0">{v.role}</Badge>
                      <div className="flex items-center gap-1 text-[11px] text-white/70 font-bold">
                        <School className="h-3 w-3 text-secondary" /> {v.college} - {v.program}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-secondary/20 text-secondary border-none font-bold">{v.purpose}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-white font-medium">{format(new Date(v.entryTime), 'h:mm a')}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(v.entryTime), 'MMMM d, yyyy')}</p>
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
