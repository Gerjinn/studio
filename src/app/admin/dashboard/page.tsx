
"use client"

import { useMemo, useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Download, 
  TrendingUp, 
  Loader2,
  CalendarDays
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
import { format, isToday, isThisWeek, isThisMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { exportToExcel } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  // State for date range filtering
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const visitsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'visitLogs'), orderBy('entryTime', 'desc'));
  }, [db, user]);

  const { data: visits, isLoading: isLogsLoading } = useCollection(visitsQuery);

  // Global absolute stats (Today, Week, Month) - always visible
  const absoluteStats = useMemo(() => {
    if (!visits) return { today: 0, week: 0, month: 0 };
    
    return visits.reduce((acc, visit) => {
      try {
        const date = parseISO(visit.entryTime);
        if (isToday(date)) acc.today++;
        if (isThisWeek(date)) acc.week++;
        if (isThisMonth(date)) acc.month++;
      } catch (e) {}
      return acc;
    }, { today: 0, week: 0, month: 0 });
  }, [visits]);

  // Filtered visits based on the selected date range
  const filteredVisitsByRange = useMemo(() => {
    if (!visits) return [];
    if (!dateRange?.from) return visits;

    return visits.filter(visit => {
      try {
        const visitDate = parseISO(visit.entryTime);
        const start = startOfDay(dateRange.from!);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        
        return isWithinInterval(visitDate, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [visits, dateRange]);

  const collegeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisitsByRange.forEach(v => {
      if (v.visitorCollege) {
        counts[v.visitorCollege] = (counts[v.visitorCollege] || 0) + 1;
      }
    });
    return COLLEGES.map((college, idx) => ({
      name: college,
      visitors: counts[college] || 0,
      fill: `hsl(var(--chart-${(idx % 5) + 1}))`
    })).sort((a, b) => b.visitors - a.visitors);
  }, [filteredVisitsByRange]);

  const purposeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisitsByRange.forEach(v => {
      const p = v.categorizedPurpose || v.purpose;
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return VISIT_PURPOSES.map((purpose, idx) => ({
      name: purpose,
      value: counts[purpose] || 0,
      fill: `hsl(var(--chart-${(idx % 5) + 1}))`
    })).filter(d => d.value > 0);
  }, [filteredVisitsByRange]);

  const recentVisits = useMemo(() => {
    return filteredVisitsByRange.slice(0, 10);
  }, [filteredVisitsByRange]);

  const handleExport = () => {
    if (!filteredVisitsByRange || filteredVisitsByRange.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "No visit logs available for the selected period.",
      });
      return;
    }

    const exportData = filteredVisitsByRange.map(v => ({
      'Visitor Name': v.visitorFullName,
      'ID Number': v.visitorIdNumber,
      'Email': v.visitorEmail,
      'Role': v.visitorRole,
      'College': v.visitorCollege,
      'Purpose': v.categorizedPurpose || v.purpose,
      'Entry Time': v.entryTime ? format(parseISO(v.entryTime), 'MMMM d, yyyy h:mm a') : 'N/A',
    }));

    const dateStr = dateRange?.from 
      ? `_${format(dateRange.from, 'yyyyMMdd')}${dateRange.to ? `_to_${format(dateRange.to, 'yyyyMMdd')}` : ''}`
      : `_${format(new Date(), 'yyyyMMdd')}`;

    exportToExcel(exportData, `NEU_Library_Report${dateStr}`);
    
    toast({
      title: "Report Exported",
      description: "Dashboard data has been exported to Excel.",
    });
  };

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
            <p className="text-muted-foreground">
              {dateRange?.from 
                ? `Showing insights for ${format(dateRange.from, 'MMM dd, yyyy')} ${dateRange.to ? ` - ${format(dateRange.to, 'MMM dd, yyyy')}` : ''}`
                : "Live insights for NEU Library Staff."}
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-card border-border/50 text-white gap-2 h-10">
                  <CalendarDays className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    "Select Date Range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="bg-card border border-white/10 rounded-lg shadow-2xl">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="rounded-md border-none"
                  />
                  {dateRange?.from && (
                    <div className="p-3 border-t border-white/5 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                        className="text-xs text-primary hover:bg-primary/10"
                      >
                        Reset Range
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleExport} className="gap-2 shadow-lg shadow-primary/20 h-10">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Visitors Today', value: absoluteStats.today.toString(), icon: Users },
            { label: 'This Week', value: absoluteStats.week.toString(), icon: TrendingUp },
            { label: 'This Month', value: absoluteStats.month.toString(), icon: CalendarIcon },
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card/30 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Visitors by College</CardTitle>
                <p className="text-xs text-muted-foreground">Distribution for the selected period</p>
              </div>
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
                <p className="text-xs text-muted-foreground">Reasons for visit in the selected period</p>
              </div>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/30 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Entries in Selected Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white">Visitor</TableHead>
                  <TableHead className="text-white">Entry Time</TableHead>
                  <TableHead className="text-white">Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisits.length > 0 ? (
                  recentVisits.map((v) => (
                    <TableRow key={v.id} className="border-white/5">
                      <TableCell className="text-white font-medium">{v.visitorFullName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{v.entryTime ? format(parseISO(v.entryTime), 'h:mm a') : 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground">{v.entryTime ? format(parseISO(v.entryTime), 'MMMM d, yyyy') : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary font-bold">{v.categorizedPurpose || v.purpose}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      No entries found for the selected date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
