import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PageLoading } from '@/components/ui/loading';
import { formatCurrency, formatDate, formatRelative, formatStatus } from '@/lib/format';
import { ArrowLeft, MapPin, Calendar, DollarSign, User, HardHat, FileText, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [availableCrew, setAvailableCrew] = useState([]);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [crewLoading, setCrewLoading] = useState(false);

  const fetchJob = () => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const { data } = await api.put(`/jobs/${id}`, { status: newStatus });
      setJob((prev) => ({ ...prev, ...data }));
      toast.success(`Status updated to ${formatStatus(newStatus)}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openCrewModal = async () => {
    setCrewModalOpen(true);
    setCrewLoading(true);
    try {
      const { data } = await api.get('/crew');
      setAvailableCrew(data);
    } catch {
      toast.error('Failed to load crew');
    } finally {
      setCrewLoading(false);
    }
  };

  const handleAssignCrew = async () => {
    if (!selectedCrewId) return;
    try {
      await api.post(`/jobs/${id}/crew`, { crewId: selectedCrewId });
      toast.success('Crew member assigned');
      setCrewModalOpen(false);
      setSelectedCrewId('');
      fetchJob();
    } catch {
      toast.error('Failed to assign crew member');
    }
  };

  const handleRemoveCrew = async (crewId) => {
    try {
      await api.delete(`/jobs/${id}/crew/${crewId}`);
      toast.success('Crew member removed');
      fetchJob();
    } catch {
      toast.error('Failed to remove crew member');
    }
  };

  if (loading) return <PageLoading />;
  if (!job) return <p className="text-text-muted">Job not found</p>;

  const address = [job.address, job.city, job.state].filter(Boolean).join(', ') + (job.zip ? ` ${job.zip}` : '');
  const lineItemsTotal = job.lineItems?.reduce((sum, li) => sum + parseFloat(li.amount || 0), 0) || 0;

  // Filter out crew already assigned
  const assignedCrewIds = new Set((job.jobCrew || []).map((jc) => jc.crew?.id));
  const unassignedCrew = availableCrew.filter((c) => !assignedCrewIds.has(c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-mono text-text-muted">{job.jobNumber}</span>
            <Badge variant={job.status}>{formatStatus(job.status)}</Badge>
            <Badge variant={job.priority}>{formatStatus(job.priority)}</Badge>
            {job.isWorkOrder && (
              <Badge className="bg-accent/10 text-accent border-accent/20">Work Order</Badge>
            )}
          </div>
          <h1 className="text-2xl font-heading font-bold mt-1 truncate">{job.title}</h1>
        </div>
        <div className="w-48 shrink-0">
          <Select
            value={job.status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            label="Change Status"
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Job Details */}
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {job.customer && (
              <div className="flex items-start gap-2 text-sm">
                <User size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Customer</p>
                  <Link to={`/customers/${job.customer.id}`} className="text-accent hover:underline font-medium">
                    {job.customer.name}
                  </Link>
                </div>
              </div>
            )}

            {address.trim() && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Address</p>
                  <p className="text-text-secondary">{address}</p>
                </div>
              </div>
            )}

            {job.scheduledDate && (
              <div className="flex items-start gap-2 text-sm">
                <Calendar size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Scheduled Date</p>
                  <p className="text-text-secondary">{formatDate(job.scheduledDate)}</p>
                </div>
              </div>
            )}

            {job.completedDate && (
              <div className="flex items-start gap-2 text-sm">
                <Calendar size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Completed Date</p>
                  <p className="text-text-secondary">{formatDate(job.completedDate)}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <DollarSign size={14} className="text-text-muted mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-text-muted">Estimated</p>
                  <p className="text-text-primary font-medium">{formatCurrency(job.estimatedAmount)}</p>
                </div>
                {job.actualAmount != null && (
                  <div>
                    <p className="text-xs text-text-muted">Actual</p>
                    <p className="text-text-primary font-medium">{formatCurrency(job.actualAmount)}</p>
                  </div>
                )}
              </div>
            </div>

            {job.description && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Description</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {job.notes && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}

            {job.createdBy && (
              <div className="pt-3 border-t border-border text-xs text-text-muted">
                Created by {job.createdBy.name || job.createdBy.email}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              {(!job.lineItems || job.lineItems.length === 0) ? (
                <p className="text-sm text-text-muted">No line items</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-3 py-2 text-text-muted font-medium">Description</th>
                        <th className="px-3 py-2 text-text-muted font-medium text-right">Qty</th>
                        <th className="px-3 py-2 text-text-muted font-medium text-right">Unit Price</th>
                        <th className="px-3 py-2 text-text-muted font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.lineItems.map((li, idx) => (
                        <tr key={li.id || idx} className="border-b border-border/50">
                          <td className="px-3 py-2 text-text-secondary">{li.description}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{li.quantity}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(li.unitPrice)}</td>
                          <td className="px-3 py-2 text-right text-text-primary font-medium">{formatCurrency(li.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={3} className="px-3 py-2 text-right text-text-muted font-medium">Total</td>
                        <td className="px-3 py-2 text-right text-text-primary font-bold">{formatCurrency(lineItemsTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crew */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HardHat size={16} className="text-text-muted" />
                  Crew ({job.jobCrew?.length || 0})
                </CardTitle>
                <Button size="sm" onClick={openCrewModal}>
                  <Plus size={14} className="mr-1" /> Assign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!job.jobCrew || job.jobCrew.length === 0) ? (
                <p className="text-sm text-text-muted">No crew assigned</p>
              ) : (
                <div className="space-y-2">
                  {job.jobCrew.map((jc) => (
                    <div key={jc.crew?.id || jc.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-light/50">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{jc.crew?.name}</p>
                        {jc.crew?.role && <p className="text-xs text-text-muted">{jc.crew.role}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => handleRemoveCrew(jc.crew?.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText size={16} className="text-text-muted" />
                  Invoices ({job.invoices?.length || 0})
                </CardTitle>
                <Link to={`/invoices/new?jobId=${job.id}&customerId=${job.customer?.id || ''}`}>
                  <Button size="sm">
                    <Plus size={14} className="mr-1" /> Create Invoice
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {(!job.invoices || job.invoices.length === 0) ? (
                <p className="text-sm text-text-muted">No invoices yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-3 py-2 text-text-muted font-medium">Invoice #</th>
                        <th className="px-3 py-2 text-text-muted font-medium">Status</th>
                        <th className="px-3 py-2 text-text-muted font-medium text-right">Total</th>
                        <th className="px-3 py-2 text-text-muted font-medium text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-light transition-colors">
                          <td className="px-3 py-2">
                            <Link to={`/invoices/${inv.id}`} className="text-accent hover:underline font-mono text-xs">
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-3 py-2"><Badge variant={inv.status}>{formatStatus(inv.status)}</Badge></td>
                          <td className="px-3 py-2 text-right">{formatCurrency(inv.total)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(inv.balanceDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          {job.activities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={16} className="text-text-muted" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {job.activities.map((activity, idx) => (
                    <div key={activity.id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" />
                      <p className="text-sm text-text-secondary">{activity.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">{formatRelative(activity.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Crew Modal */}
      <Modal open={crewModalOpen} onClose={() => setCrewModalOpen(false)} title="Assign Crew Member" size="sm">
        {crewLoading ? (
          <p className="text-sm text-text-muted">Loading crew...</p>
        ) : unassignedCrew.length === 0 ? (
          <p className="text-sm text-text-muted">No available crew members to assign</p>
        ) : (
          <div className="space-y-4">
            <Select
              label="Select Crew Member"
              placeholder="Choose a crew member"
              value={selectedCrewId}
              onChange={(e) => setSelectedCrewId(e.target.value)}
              options={unassignedCrew.map((c) => ({ value: c.id, label: c.name }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCrewModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignCrew} disabled={!selectedCrewId}>Assign</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
