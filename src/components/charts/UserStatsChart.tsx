import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useMemo } from 'react';
import type { AdminUser } from '@/types';
import { Loader2, AlertCircle, BarChart as BarChartIcon } from 'lucide-react';

interface UserStatsChartProps {
  users: AdminUser[] | null;
  loading: boolean;
  error?: string;
}

export default function UserStatsChart({ users, loading, error }: UserStatsChartProps) {
  // Aggregate users by createdAt date
  const chartData = useMemo(() => {
    if (!users || users.length === 0) return [];
    
    // Group by day string
    const countsByDay: Record<string, number> = {};
    
    users.forEach(user => {
      if (user.createdAt) {
        const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
        countsByDay[dateStr] = (countsByDay[dateStr] || 0) + 1;
      }
    });

    // Create an ordered array
    let output = Object.entries(countsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
      
    return output;
  }, [users]);

  if (loading) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center bg-card rounded-2xl border border-border">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="text-sm text-muted-foreground">Loading growth data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center bg-card rounded-2xl border border-destructive/30">
        <AlertCircle className="text-destructive mb-2" size={32} />
        <p className="text-sm font-medium text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center bg-card rounded-2xl border border-border">
        <BarChartIcon className="text-muted-foreground mb-2" size={32} opacity={0.5} />
        <p className="text-sm font-medium text-foreground">No Registration Data</p>
        <p className="text-xs text-muted-foreground mt-1">Not enough user data available</p>
      </div>
    );
  }

  const primaryColor = "#10BA41"; 

  return (
    <div className="h-[350px] w-full bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Registration Trends</h3>
        <p className="text-sm text-muted-foreground">User signups based on the current list</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => {
                const parts = value.split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : value;
              }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: '#1A1A1A'
              }}
              formatter={(value: any) => [`${value} Accounts`, 'Created']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={primaryColor} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
