import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageLoading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, formatStatus } from '@/lib/format';
import { Plus, Search, FileText } from 'lucide-react';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  async function fetchInvoices() {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/invoices', { params });
      setInvoices(data.invoices);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Invoices</h1>
        <Link to="/invoices/new"><Button><Plus size={16} /> New Invoice</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoices..."
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

      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice." action={<Link to="/invoices/new"><Button><Plus size={16} /> New Invoice</Button></Link>} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-text-muted font-medium">Invoice</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden md:table-cell">Customer</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Job</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Status</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-right">Total</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-right hidden sm:table-cell">Balance</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-light transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/invoices/${inv.id}`} className="text-accent hover:text-accent-hover font-mono text-xs font-medium">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary">
                      {inv.customer?.company || inv.customer?.name}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {inv.job ? (
                        <Link to={`/jobs/${inv.job.id}`} className="text-xs text-text-muted hover:text-accent">{inv.job.jobNumber}</Link>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={inv.status}>{formatStatus(inv.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={parseFloat(inv.balanceDue) > 0 ? 'text-warning' : 'text-success'}>
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs">{formatDate(inv.dueDate)}</td>
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
