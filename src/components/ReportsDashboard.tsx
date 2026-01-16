import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, subMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, Users, DollarSign, Clock, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

interface ReportsDashboardProps {
  appointments: AppointmentDB[];
  loading: boolean;
  onFetchRange: (startDate: string, endDate: string) => Promise<void>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ReportsDashboard({ appointments, loading, onFetchRange }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');

  const handlePeriodChange = async (newPeriod: 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    let from: Date, to: Date;
    
    if (newPeriod === 'week') {
      from = startOfWeek(new Date(), { weekStartsOn: 1 });
      to = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (newPeriod === 'month') {
      from = startOfMonth(new Date());
      to = endOfMonth(new Date());
    } else {
      return;
    }
    
    setDateRange({ from, to });
    await onFetchRange(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'));
  };

  const handleDateRangeChange = async (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setPeriod('custom');
      await onFetchRange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'));
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const paidRevenue = completed.filter(a => a.is_paid).reduce((sum, a) => sum + (a.price || 0), 0);
    const unpaidRevenue = totalRevenue - paidRevenue;
    const avgDuration = appointments.length > 0 
      ? appointments.reduce((sum, a) => sum + a.duration, 0) / appointments.length 
      : 0;
    
    const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;
    
    const statusCounts = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: appointments.length,
      completed: completed.length,
      cancelled: statusCounts['cancelled'] || 0,
      noShow: statusCounts['no_show'] || 0,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      avgDuration: Math.round(avgDuration),
      uniquePatients,
    };
  }, [appointments]);

  // Treatment popularity data
  const treatmentData = useMemo(() => {
    const counts = appointments.reduce((acc, a) => {
      const name = a.treatments?.name || 'Necunoscut';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [appointments]);

  // Daily appointments data
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(a => a.appointment_date === dayStr);
      const completed = dayAppointments.filter(a => a.status === 'completed');
      
      return {
        date: format(day, 'dd MMM', { locale: ro }),
        programări: dayAppointments.length,
        finalizate: completed.length,
        venituri: completed.reduce((sum, a) => sum + (a.price || 0), 0),
      };
    });
  }, [appointments, dateRange]);

  // Cabinet data
  const cabinetData = useMemo(() => {
    const counts = appointments.reduce((acc, a) => {
      const cabinet = `Cabinet ${a.cabinet_id}`;
      acc[cabinet] = (acc[cabinet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('week')}
          >
            Săptămâna curentă
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('month')}
          >
            Luna curentă
          </Button>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, 'dd MMM', { locale: ro })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ro })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => range && handleDateRangeChange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programări</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} finalizate, {stats.cancelled} anulate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venituri</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidRevenue.toLocaleString()} încasați, {stats.unpaidRevenue.toLocaleString()} restanți
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacienți Unici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniquePatients}</div>
            <p className="text-xs text-muted-foreground">
              în perioada selectată
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durată Medie</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} min</div>
            <p className="text-xs text-muted-foreground">
              per programare
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Programări pe zile</CardTitle>
            <CardDescription>Evoluția programărilor în perioada selectată</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="programări" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="finalizate" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tratamente populare</CardTitle>
            <CardDescription>Distribuția pe tipuri de tratamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={treatmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {treatmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cabinet Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupare cabinete</CardTitle>
          <CardDescription>Numărul de programări pe cabinet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cabinetData.map((cabinet, index) => (
              <div key={cabinet.name} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{cabinet.name}</div>
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(cabinet.value / stats.total) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-right text-muted-foreground">
                  {cabinet.value} ({Math.round((cabinet.value / stats.total) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
