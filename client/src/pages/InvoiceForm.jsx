import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyLine = { description: '', quantity: 1, unitPrice: '', amount: 0 };

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preJobId = searchParams.get('jobId');
  const preCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerId: preCustomerId || '',
    jobId: preJobId || '',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    taxRate: '0',
    notes: '',
  });
  const [lineItems, setLineItems] = useState([{ ...emptyLine }]);

  useEffect(() => {
    Promise.all([
      api.get('/customers', { params: { limit: 200 } }),
      api.get('/jobs', { params: { limit: 200 } }),
    ]).then(([custRes, jobRes]) => {
      setCustomers(custRes.data.customers);
      setJobs(jobRes.data.jobs);

      // Pre-fill line items from job
      if (preJobId) {
        const job = jobRes.data.jobs.find((j) => j.id === preJobId);
        if (job) {
          api.get(`/jobs/${preJobId}`).then(({ data }) => {
            if (data.lineItems?.length) {
              setLineItems(data.lineItems.map((li) => ({
                description: li.description,
                quantity: parseFloat(li.quantity),
                unitPrice: parseFloat(li.unitPrice),
                amount: parseFloat(li.amount),
              })));
            }
            if (data.customerId && !form.customerId) {
              setForm((f) => ({ ...f, customerId: data.customerId }));
            }
          });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  function updateLine(idx, field, value) {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(field === 'quantity' ? value : updated[idx].quantity) || 0;
        const price = parseFloat(field === 'unitPrice' ? value : updated[idx].unitPrice) || 0;
        updated[idx].amount = Math.round(qty * price * 100) / 100;
      }
      return updated;
    });
  }

  function addLine() { setLineItems((prev) => [...prev, { ...emptyLine }]); }
  function removeLine(idx) { setLineItems((prev) => prev.filter((_, i) => i !== idx)); }

  const subtotal = lineItems.reduce((sum, li) => sum + (li.amount || 0), 0);
  const taxAmount = subtotal * (parseFloat(form.taxRate) || 0) / 100;
  const total = subtotal + taxAmount;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customerId) { toast.error('Select a customer'); return; }
    if (lineItems.length === 0 || !lineItems[0].description) { toast.error('Add at least one line item'); return; }

    setSaving(true);
    try {
      const payload = {
        customerId: form.customerId,
        jobId: form.jobId || null,
        dueDate: form.dueDate,
        taxRate: parseFloat(form.taxRate) || 0,
        notes: form.notes,
        lineItems: lineItems.filter((li) => li.description).map((li) => ({
          description: li.description,
          quantity: parseFloat(li.quantity) || 1,
          unitPrice: parseFloat(li.unitPrice) || 0,
          amount: li.amount,
        })),
      };

      const { data } = await api.post('/invoices', payload);
      toast.success(`Invoice ${data.invoiceNumber} created`);
      navigate(`/invoices/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    } finally { setSaving(false); }
  }

  function updateForm(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-heading font-bold">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Customer *"
                value={form.customerId}
                onChange={(e) => updateForm('customerId', e.target.value)}
                placeholder="Select customer..."
                options={customers.map((c) => ({ value: c.id, label: c.company ? `${c.name} (${c.company})` : c.name }))}
                required
              />
              <Select
                label="Linked Job"
                value={form.jobId}
                onChange={(e) => updateForm('jobId', e.target.value)}
                placeholder="None"
                options={jobs.map((j) => ({ value: j.id, label: `${j.jobNumber} — ${j.title}` }))}
              />
              <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => updateForm('dueDate', e.target.value)} />
              <Input label="Tax Rate (%)" type="number" step="0.01" min="0" value={form.taxRate} onChange={(e) => updateForm('taxRate', e.target.value)} />
              <Textarea label="Notes" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} className="sm:col-span-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" size="sm" variant="secondary" onClick={addLine}><Plus size={14} /> Add Item</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <Input placeholder="Description" value={li.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input placeholder="Qty" type="number" step="0.01" min="0" value={li.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input placeholder="Price" type="number" step="0.01" min="0" value={li.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right py-2 text-sm font-medium">
                    ${(li.amount || 0).toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="p-2 text-text-muted hover:text-danger cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-1 text-right text-sm">
              <div className="flex justify-end gap-8"><span className="text-text-muted">Subtotal</span><span className="w-28">${subtotal.toFixed(2)}</span></div>
              {taxAmount > 0 && (
                <div className="flex justify-end gap-8"><span className="text-text-muted">Tax ({form.taxRate}%)</span><span className="w-28">${taxAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-end gap-8 text-lg font-bold"><span>Total</span><span className="w-28">${total.toFixed(2)}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}
