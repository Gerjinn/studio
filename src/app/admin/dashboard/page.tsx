
"use client"

import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Search, 
  Download, 
  TrendingUp, 
  Filter,
  MoreVertical
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
import { MOCK_VISITORS, COLLEGES, VISIT_PURPOSES } from '@/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';

const collegeData = COLLEGES.map((college, idx) => ({
  name: college,
  visitors: Math.floor(Math.random() * 50) + 10,
  fill: `hsl(var(--chart-${(idx % 5) + 1}))`
}));

const purposeData = VISIT_PURPOSES.map((purpose, idx) => ({
  name: purpose,
  value: Math.floor(Math.random() * 40) + 5,
  fill: `hsl(var(--chart-${(idx % 5) + 1}))`
}));

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
              May 20, 2024
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
            { label: 'Total Visitors Today', value: '124', icon: Users, trend: '+12%' },
            { label: 'This Week', value: '842', icon: TrendingUp, trend: '+5%' },
            { label: 'This Month', value: '3,120', icon: Calendar, trend: '+18%' },
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
                  <BarChart data={collegeData} layout="vertical">
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
                      {collegeData.map((entry, index) => (
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
                      data={purposeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {purposeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#233c4b', border: 'none', borderRadius: '8px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 ml-4">
                  {purposeData.map((p) => (
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search visitors..." 
                  className="pl-9 bg-card/50 border-white/10 w-64 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
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
                {MOCK_VISITORS.map((v) => (
                  <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.idNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(v.entryTime), 'h:mm a, MMM d')}
                    </TableCell>
                    <TableCell className="text-white">
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {v.program}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded text-[10px] font-bold">
                        {v.purpose}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
              <Button variant="link" className="text-primary hover:text-primary/80 font-bold">
                View All Visitor Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
