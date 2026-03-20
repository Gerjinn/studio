
"use client"

import { useMemo, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Download, 
  TrendingUp, 
  MoreVertical,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { COLLEGES, VISIT_PURPOSES } from '@/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  // Ensure the admin role document exists if they land here
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
      return;
    }
    
    if (user && user.email?.endsWith('@neu.edu.ph')) {
      const adminRef = doc(db, 'roles_admin', user.uid);
      setDoc(adminRef, {
        email: user.email,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
  }, [user, isUserLoading, router, db]);

  const visitsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'visitLogs'), orderBy('entryTime', 'desc'));
  }, [db, user]);

  const { data: visits, isLoading: isLogsLoading } = useCollection(visitsQuery);

  // Derived statistics
  const stats = useMemo(() => {
    if (!visits) return { today: 0, week: 0, month: 0 };
    
    return visits.reduce((acc, visit) => {
      try {
        const date = parseISO(visit.entryTime);
        if (isToday(date)) acc.today++;
        if (isThisWeek(date)) acc.week++;
        if (isThisMonth(date)) acc.month++;
      } catch (e) {
        // Skip malformed dates
      }
      return acc;
    }, { today: 0, week: 0, month: 0 });
  }, [visits]);

  const collegeChartData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      if (v.visitorCollege) {
        counts[v.visitorCollege] = (counts[v.visitorCollege] || 0) + 1;
      }
    });
    return COLLEGES.map((college, idx) => ({
      name: college,
      visitors: counts[college] || 0,
      fill: `hsl(var(--chart-${(idx % 5) + 1}))`
    })).sort((a, b) => b.visitors - a.visitors);
  }, [visits]);

  const purposeChartData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      const p = v.categorizedPurpose || v.purpose;
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return VISIT_PURPOSES.map((purpose, idx) => ({
      name: purpose,
      value: counts[purpose] || 0,
      fill: `hsl(var(--chart-${(idx % 5) + 1}))`
    })).filter(d => d.value > 0);
  }, [visits]);

  const recentVisits = useMemo(() => {
    return visits?.slice(0, 5) || [];
  }, [visits]);

  if (isUserLoading || (user && isLogsLoading)) {
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-white">Dashboard Overview</h1>
            <p className="text-muted-foreground">Real-time statistics for NEU Library visitors.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card border-border/50 text-white gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'MMMM d, yyyy')}
            </Button>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Download className="h-4 w-4" />
              Export Reports
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Visitors Today', value: stats.today.toString(), icon: Users, trend: '+0%' },
            { label: 'This Week', value: stats.week.toString(), icon: TrendingUp, trend: '+0%' },
            { label: 'This Month', value: stats.month.toString(), icon: Calendar, trend: '+0%' },
          ].map((stat, i) => (
            <Card key={i} className="bg-card/30 border-white/5 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="h-20 w-20 text-white" />
              </div>
              <CardHeader className="pb-2">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{stat.label}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-black text-white">{stat.value}</h3>
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card/30 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Visitors by College</CardTitle>
                <p className="text-xs text-muted-foreground">Distribution across NEU departments</p>
              </div>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={collegeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#888" 
                      fontSize={11} 
                      width={100} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#233c4b', border: 'none', borderRadius: '8px'}}
                    />
                    <Bar dataKey="visitors" radius={[0, 4, 4, 0]}>
                      {collegeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Visit Purposes</CardTitle>
                <p className="text-xs text-muted-foreground">Activity breakdown trends</p>
              </div>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purposeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {purposeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#233c4b', border: 'none', borderRadius: '8px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 ml-4">
                  {purposeChartData.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.fill}} />
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{p.name}</span>
                      <span className="text-[10px] font-bold text-white">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visits Table */}
        <Card className="bg-card/30 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Recent Visits Log</CardTitle>
              <p className="text-xs text-muted-foreground">Live feed of library entries</p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white font-bold">Visitor Name</TableHead>
                  <TableHead className="text-white font-bold">ID Number</TableHead>
                  <TableHead className="text-white font-bold">Entry Time</TableHead>
                  <TableHead className="text-white font-bold">Program</TableHead>
                  <TableHead className="text-white font-bold">Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisits.map((v) => (
                  <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{v.visitorFullName}</TableCell>
                    <TableCell className="text-muted-foreground">{v.visitorIdNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.entryTime ? format(parseISO(v.entryTime), 'h:mm a, MMM d') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-white">
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {v.visitorProgram || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded text-[10px] font-bold">
                        {v.categorizedPurpose || v.purpose}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
