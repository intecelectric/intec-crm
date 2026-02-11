import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { PageLoading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { formatStatus, formatPhone } from '@/lib/format';
import { Plus, Search, Users, Mail, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
];

const defaultForm = { name: '', email: '', phone: '', company: '', address: '', city: '', state: 'FL', zip: '', notes: '', type: 'RESIDENTIAL' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCustomers(); }, [search, typeFilter]);

  async function fetchCustomers() {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/customers', { params });
      setCustomers(data.customers);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm(defaultForm);
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(c) {
    setForm({
      name: c.name || '', email: c.email || '', phone: c.phone || '',
      company: c.company || '', address: c.address || '', city: c.city || '',
      state: c.state || 'FL', zip: c.zip || '', notes: c.notes || '', type: c.type || 'RESIDENTIAL',
    });
    setEditing(c.id);
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Customers</h1>
        <Button onClick={openCreate}><Plus size={16} /> New Customer</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="All Types"
          options={typeOptions}
          className="w-full sm:w-44"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Create your first customer to get started." action={<Button onClick={openCreate}><Plus size={16} /> New Customer</Button>} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-text-muted font-medium">Name</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-center">Jobs</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-center">Invoices</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-light transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{c.name}</p>
                      {c.company && <p className="text-xs text-text-muted flex items-center gap-1"><Building size={10} />{c.company}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.email && <p className="text-xs text-text-secondary flex items-center gap-1"><Mail size={10} />{c.email}</p>}
                      {c.phone && <p className="text-xs text-text-muted flex items-center gap-1"><Phone size={10} />{formatPhone(c.phone)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={c.type}>{formatStatus(c.type)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary">{c._count?.jobs || 0}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{c._count?.invoices || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/customers/${c.id}`} className="px-2 py-1 text-xs text-accent hover:text-accent-hover">View</Link>
                        <button onClick={() => openEdit(c)} className="px-2 py-1 text-xs text-text-muted hover:text-text-primary cursor-pointer">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'New Customer'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name *" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
            <Select label="Type" value={form.type} onChange={(e) => updateForm('type', e.target.value)} options={typeOptions} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
            <Input label="Company" value={form.company} onChange={(e) => updateForm('company', e.target.value)} className="sm:col-span-2" />
            <Input label="Address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className="sm:col-span-2" />
            <Input label="City" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="State" value={form.state} onChange={(e) => updateForm('state', e.target.value)} />
              <Input label="ZIP" value={form.zip} onChange={(e) => updateForm('zip', e.target.value)} />
            </div>
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
