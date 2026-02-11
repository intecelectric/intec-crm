import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageLoading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, formatStatus } from '@/lib/format';
import { Plus, Search, Briefcase, Inbox } from 'lucide-react';

const statusOptions = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Jobs() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => { fetchJobs(); }, [search, statusFilter]);

  async function fetchJobs() {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Jobs</h1>
        <Link to="/jobs/new"><Button><Plus size={16} /> New Job</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All Statuses"
          options={statusOptions}
          className="w-full sm:w-44"
        />
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description="Create a new job to get started." action={<Link to="/jobs/new"><Button><Plus size={16} /> New Job</Button></Link>} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-text-muted font-medium">Job</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden md:table-cell">Customer</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Status</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Priority</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Scheduled</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-surface-light transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/jobs/${job.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-muted">{job.jobNumber}</span>
                          {job.isWorkOrder && <Inbox size={12} className="text-accent" title="Work Order" />}
                        </div>
                        <p className="text-sm font-medium text-text-primary hover:text-accent transition-colors">{job.title}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary">
                      {job.customer?.company || job.customer?.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={job.status}>{formatStatus(job.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={job.priority}>{job.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs">
                      {formatDate(job.scheduledDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(job.estimatedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
