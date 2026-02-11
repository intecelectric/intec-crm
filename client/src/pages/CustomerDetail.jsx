import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading';
import { formatCurrency, formatDate, formatStatus, formatPhone } from '@/lib/format';
import { ArrowLeft, Mail, Phone, MapPin, Building } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then(({ data }) => setCustomer(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading />;
  if (!customer) return <p className="text-text-muted">Customer not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customers">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={customer.type}>{formatStatus(customer.type)}</Badge>
            {customer.company && <span className="text-sm text-text-muted">{customer.company}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-text-muted" />
                <a href={`mailto:${customer.email}`} className="text-accent hover:underline">{customer.email}</a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-muted" />
                <span>{formatPhone(customer.phone)}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-text-muted mt-0.5" />
                <span>{customer.address}{customer.city ? `, ${customer.city}` : ''}{customer.state ? `, ${customer.state}` : ''} {customer.zip}</span>
              </div>
            )}
            {customer.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-text-muted">Notes</p>
                <p className="text-sm text-text-secondary mt-1">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Jobs ({customer.jobs?.length || 0})</CardTitle>
              <Link to={`/jobs/new?customerId=${customer.id}`}>
                <Button size="sm">New Job</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(!customer.jobs || customer.jobs.length === 0) ? (
              <p className="text-sm text-text-muted">No jobs yet</p>
            ) : (
              <div className="space-y-2">
                {customer.jobs.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-light transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-muted">{job.jobNumber}</span>
                        <Badge variant={job.status}>{formatStatus(job.status)}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-0.5">{job.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(job.estimatedAmount)}</p>
                      <p className="text-xs text-text-muted">{formatDate(job.scheduledDate)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      {customer.invoices?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Invoices ({customer.invoices.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-2 text-text-muted font-medium">Invoice #</th>
                    <th className="px-3 py-2 text-text-muted font-medium">Status</th>
                    <th className="px-3 py-2 text-text-muted font-medium text-right">Total</th>
                    <th className="px-3 py-2 text-text-muted font-medium text-right">Balance</th>
                    <th className="px-3 py-2 text-text-muted font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-light transition-colors">
                      <td className="px-3 py-2">
                        <Link to={`/invoices/${inv.id}`} className="text-accent hover:underline font-mono text-xs">{inv.invoiceNumber}</Link>
                      </td>
                      <td className="px-3 py-2"><Badge variant={inv.status}>{formatStatus(inv.status)}</Badge></td>
                      <td className="px-3 py-2 text-right">{formatCurrency(inv.total)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(inv.balanceDue)}</td>
                      <td className="px-3 py-2 text-text-muted">{formatDate(inv.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
