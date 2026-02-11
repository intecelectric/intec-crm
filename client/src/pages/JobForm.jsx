import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const EMPTY_LINE_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 };

export default function JobForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    title: '',
    customerId: searchParams.get('customerId') || '',
    status: 'LEAD',
    priority: 'MEDIUM',
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    scheduledDate: '',
    estimatedAmount: '',
    description: '',
    notes: '',
    isWorkOrder: false,
    workOrderEmail: '',
  });

  const [lineItems, setLineItems] = useState([{ ...EMPTY_LINE_ITEM }]);
  const [errors, setErrors] = useState({});

  // Fetch customers list
  useEffect(() => {
    api.get('/customers')
      .then(({ data }) => {
        const list = data.customers || data;
        setCustomers(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error('Failed to load customers'));
  }, []);

  // Fetch job data in edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/jobs/${id}`)
      .then(({ data }) => {
        const job = data;
        setForm({
          title: job.title || '',
          customerId: job.customerId || '',
          status: job.status || 'LEAD',
          priority: job.priority || 'MEDIUM',
          address: job.address || '',
          city: job.city || '',
          state: job.state || 'FL',
          zip: job.zip || '',
          scheduledDate: job.scheduledDate ? job.scheduledDate.slice(0, 10) : '',
          estimatedAmount: job.estimatedAmount ?? '',
          description: job.description || '',
          notes: job.notes || '',
          isWorkOrder: job.isWorkOrder || false,
          workOrderEmail: job.workOrderEmail || '',
        });
        if (job.lineItems && job.lineItems.length > 0) {
          setLineItems(job.lineItems.map((li) => ({
            description: li.description || '',
            quantity: li.quantity ?? 1,
            unitPrice: li.unitPrice ?? 0,
            amount: li.amount ?? (li.quantity ?? 1) * (li.unitPrice ?? 0),
          })));
        }
      })
      .catch(() => toast.error('Failed to load job'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
        const price = parseFloat(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
        updated[index].amount = Math.round(qty * price * 100) / 100;
      }
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }]);
  };

  const removeLineItem = (index) => {
    setLineItems((prev) => prev.length === 1 ? [{ ...EMPTY_LINE_ITEM }] : prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.customerId) errs.customerId = 'Customer is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        estimatedAmount: form.estimatedAmount !== '' ? parseFloat(form.estimatedAmount) : null,
        scheduledDate: form.scheduledDate || null,
        lineItems: lineItems.filter((li) => li.description.trim()),
      };

      if (!payload.isWorkOrder) {
        delete payload.workOrderEmail;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/jobs/${id}`, payload);
      } else {
        res = await api.post('/jobs', payload);
      }

      toast.success(isEdit ? 'Job updated' : 'Job created');
      navigate(`/jobs/${res.data.id || id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name + (c.company ? ` (${c.company})` : ''),
  }));

  const lineItemsTotal = lineItems.reduce((sum, li) => sum + (li.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          {isEdit ? 'Edit Job' : 'New Job'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title *"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Job title"
                error={errors.title}
              />
              <Select
                label="Customer *"
                name="customerId"
                value={form.customerId}
                onChange={handleChange}
                options={customerOptions}
                placeholder="Select customer"
                error={errors.customerId}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                options={PRIORITY_OPTIONS}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="col-span-2 md:col-span-1"
              />
              <Input
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
              />
              <Input
                label="ZIP"
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="ZIP code"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scheduling & Estimate */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduling &amp; Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Scheduled Date"
                name="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={handleChange}
              />
              <Input
                label="Estimated Amount"
                name="estimatedAmount"
                type="number"
                step="0.01"
                min="0"
                value={form.estimatedAmount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <Textarea
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Job description..."
              rows={3}
            />
            <Textarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Internal notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Work Order */}
        <Card>
          <CardHeader>
            <CardTitle>Work Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isWorkOrder"
                checked={form.isWorkOrder}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30"
              />
              <span className="text-sm text-text-primary">This is a work order</span>
            </label>
            {form.isWorkOrder && (
              <Input
                label="Work Order Email"
                name="workOrderEmail"
                type="email"
                value={form.workOrderEmail}
                onChange={handleChange}
                placeholder="Email for work order notifications"
              />
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={addLineItem}>
                <Plus size={14} />
                Add Line Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Column headers */}
              <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_100px_40px] gap-3 text-xs text-text-muted font-medium px-1">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>Amount</span>
                <span></span>
              </div>

              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_100px_40px] gap-3 items-start p-3 md:p-0 bg-surface-light md:bg-transparent rounded-lg md:rounded-none"
                >
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                  />
                  <div className="flex items-center h-[38px] px-3 text-sm text-text-secondary bg-surface border border-border rounded-lg">
                    ${item.amount.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    className="text-text-muted hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}

              {/* Total */}
              {lineItems.some((li) => li.description.trim()) && (
                <div className="flex justify-end pt-3 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    Total: <span className="font-semibold text-text-primary">${lineItemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="secondary" onClick={() => navigate('/jobs')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
