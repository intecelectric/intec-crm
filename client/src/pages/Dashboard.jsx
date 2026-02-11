import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatRelative, formatStatus, formatDate } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading';
import {
  Users, Briefcase, FileText, DollarSign, AlertTriangle,
  Clock, TrendingUp, Inbox
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'text-accent' }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-2.5 rounded-lg bg-surface-light ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (!data) return <p className="text-text-muted">Failed to load dashboard</p>;

  const { stats, recentActivities, recentJobs } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-sm text-text-muted">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="text-success" />
        <StatCard icon={TrendingUp} label="Outstanding" value={formatCurrency(stats.outstandingBalance)} color="text-warning" />
        <StatCard icon={Briefcase} label="Active Jobs" value={stats.activeJobs} sub={`${stats.totalJobs} total`} />
        <StatCard icon={Users} label="Customers" value={stats.totalCustomers} />
      </div>

      {/* Alert cards */}
      {(stats.overdueInvoices > 0 || stats.pendingWorkOrders > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.overdueInvoices > 0 && (
            <Link to="/invoices?status=OVERDUE">
              <Card className="border-danger/30 hover:border-danger/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-danger" />
                  <div>
                    <p className="font-medium text-danger">{stats.overdueInvoices} Overdue Invoice{stats.overdueInvoices > 1 ? 's' : ''}</p>
                    <p className="text-xs text-text-muted">Requires immediate attention</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {stats.pendingWorkOrders > 0 && (
            <Link to="/jobs?isWorkOrder=true&status=LEAD">
              <Card className="border-accent/30 hover:border-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Inbox size={20} className="text-accent" />
                  <div>
                    <p className="font-medium text-accent">{stats.pendingWorkOrders} New Work Order{stats.pendingWorkOrders > 1 ? 's' : ''}</p>
                    <p className="text-xs text-text-muted">Awaiting review</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Jobs</CardTitle>
              <Link to="/jobs" className="text-xs text-accent hover:text-accent-hover">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.length === 0 && <p className="text-sm text-text-muted">No active jobs</p>}
              {recentJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-light transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-mono">{job.jobNumber}</span>
                      <Badge variant={job.status}>{formatStatus(job.status)}</Badge>
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate mt-0.5">{job.title}</p>
                    <p className="text-xs text-text-muted">{job.customer?.company || job.customer?.name}</p>
                  </div>
                  {job.scheduledDate && (
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-text-muted">{formatDate(job.scheduledDate)}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link to="/activity" className="text-xs text-accent hover:text-accent-hover">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 && <p className="text-sm text-text-muted">No recent activity</p>}
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">{act.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {act.job && (
                        <Link to={`/jobs/${act.job.id || ''}`} className="text-xs text-accent hover:underline">
                          {act.job.jobNumber}
                        </Link>
                      )}
                      <span className="text-xs text-text-muted">{formatRelative(act.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
