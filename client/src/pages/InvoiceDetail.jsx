import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PageLoading } from '@/components/ui/loading';
import { formatCurrency, formatDate, formatRelative, formatStatus } from '@/lib/format';
import { ArrowLeft, Send, DollarSign, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const paymentMethods = [
  { value: 'CHECK', label: 'Check' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'OTHER', label: 'Other' },
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CHECK', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchInvoice(); }, [id]);

  async function fetchInvoice() {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleSend() {
    try {
      await api.post(`/invoices/${id}/send`);
      toast.success('Invoice marked as sent');
      fetchInvoice();
    } catch { toast.error('Failed to send'); }
  }

  async function handlePayment(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/invoices/${id}/payments`, {
        amount: parseFloat(payForm.amount),
        method: payForm.method,
        reference: payForm.reference,
        notes: payForm.notes,
      });
      toast.success('Payment recorded');
      setShowPayment(false);
      setPayForm({ amount: '', method: 'CHECK', reference: '', notes: '' });
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally { setSaving(false); }
  }

  async function handleDownloadPdf() {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF generation not available yet');
    }
  }

  if (loading) return <PageLoading />;
  if (!invoice) return <p className="text-text-muted">Invoice not found</p>;

  const bal = parseFloat(invoice.balanceDue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/invoices"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-bold">{invoice.invoiceNumber}</h1>
              <Badge variant={invoice.status}>{formatStatus(invoice.status)}</Badge>
            </div>
            <p className="text-sm text-text-muted">{invoice.customer?.company || invoice.customer?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <Button variant="secondary" onClick={handleSend}><Send size={14} /> Mark Sent</Button>
          )}
          {bal > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
            <Button variant="secondary" onClick={() => { setPayForm(p => ({ ...p, amount: String(bal) })); setShowPayment(true); }}>
              <DollarSign size={14} /> Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPdf}><Download size={14} /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Customer</span>
              <Link to={`/customers/${invoice.customer?.id}`} className="text-accent hover:underline">{invoice.customer?.name}</Link>
            </div>
            {invoice.job && (
              <div className="flex justify-between"><span className="text-text-muted">Job</span>
                <Link to={`/jobs/${invoice.job.id}`} className="text-accent hover:underline">{invoice.job.jobNumber}</Link>
              </div>
            )}
            <div className="flex justify-between"><span className="text-text-muted">Issue Date</span><span>{formatDate(invoice.issueDate)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Due Date</span><span>{formatDate(invoice.dueDate)}</span></div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              {parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex justify-between"><span className="text-text-muted">Tax ({invoice.taxRate}%)</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
              )}
              <div className="flex justify-between font-medium text-base"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Paid</span><span className="text-success">{formatCurrency(invoice.amountPaid)}</span></div>
              <div className="flex justify-between font-bold text-lg">
                <span>Balance Due</span>
                <span className={bal > 0 ? 'text-warning' : 'text-success'}>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
            {invoice.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-text-muted">Notes</p>
                <p className="text-text-secondary mt-1">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items + Payments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-3 py-2 text-text-muted font-medium">Description</th>
                      <th className="px-3 py-2 text-text-muted font-medium text-right w-20">Qty</th>
                      <th className="px-3 py-2 text-text-muted font-medium text-right w-28">Unit Price</th>
                      <th className="px-3 py-2 text-text-muted font-medium text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems?.map((li) => (
                      <tr key={li.id} className="border-b border-border/50">
                        <td className="px-3 py-2 text-text-primary">{li.description}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{parseFloat(li.quantity)}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(li.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(li.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium">Total</td>
                      <td className="px-3 py-2 text-right font-bold">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          {invoice.payments?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-light">
                      <div>
                        <p className="text-sm font-medium text-success">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-text-muted">{formatStatus(p.method)}{p.reference ? ` — ${p.reference}` : ''}</p>
                      </div>
                      <span className="text-xs text-text-muted">{formatDate(p.paidAt)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          {invoice.activities?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-accent shrink-0" />
                      <div>
                        <p className="text-sm text-text-primary">{act.description}</p>
                        <span className="text-xs text-text-muted">{formatRelative(act.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <Input label="Amount *" type="number" step="0.01" min="0.01" value={payForm.amount} onChange={(e) => setPayForm(p => ({ ...p, amount: e.target.value }))} required />
          <Select label="Method" value={payForm.method} onChange={(e) => setPayForm(p => ({ ...p, method: e.target.value }))} options={paymentMethods} />
          <Input label="Reference" placeholder="Check #, transaction ID..." value={payForm.reference} onChange={(e) => setPayForm(p => ({ ...p, reference: e.target.value }))} />
          <Input label="Notes" value={payForm.notes} onChange={(e) => setPayForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Recording...' : 'Record Payment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
