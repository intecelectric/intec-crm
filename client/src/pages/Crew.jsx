import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/format';
import { Plus, HardHat, Phone, Mail, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const defaultForm = { name: '', phone: '', email: '', role: 'Electrician', rate: '' };

export default function Crew() {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCrew(); }, []);

  async function fetchCrew() {
    try {
      const { data } = await api.get('/crew');
      setCrew(data);
    } catch {}
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm(defaultForm);
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(m) {
    setForm({ name: m.name || '', phone: m.phone || '', email: m.email || '', role: m.role || '', rate: m.rate || '' });
    setEditing(m.id);
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, rate: form.rate ? parseFloat(form.rate) : null };
      if (editing) {
        await api.put(`/crew/${editing}`, payload);
        toast.success('Crew member updated');
      } else {
        await api.post('/crew', payload);
        toast.success('Crew member added');
      }
      setShowModal(false);
      fetchCrew();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  function updateForm(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Crew</h1>
        <Button onClick={openCreate}><Plus size={16} /> Add Crew Member</Button>
      </div>

      {crew.length === 0 ? (
        <EmptyState icon={HardHat} title="No crew members" description="Add your first crew member." action={<Button onClick={openCreate}><Plus size={16} /> Add</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crew.map((m) => (
            <Card key={m.id} className={`relative ${!m.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-text-primary">{m.name}</h3>
                  <p className="text-sm text-accent">{m.role}</p>
                </div>
                <button onClick={() => openEdit(m)} className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer">
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                {m.phone && <p className="flex items-center gap-2 text-text-secondary"><Phone size={12} className="text-text-muted" />{m.phone}</p>}
                {m.email && <p className="flex items-center gap-2 text-text-secondary"><Mail size={12} className="text-text-muted" />{m.email}</p>}
                {m.rate && <p className="text-text-muted">{formatCurrency(m.rate)}/hr</p>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-text-muted">{m._count?.jobCrew || 0} job{(m._count?.jobCrew || 0) !== 1 ? 's' : ''} assigned</span>
                {!m.active && <Badge variant="CANCELLED">Inactive</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Crew Member' : 'Add Crew Member'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
          <Input label="Role" value={form.role} onChange={(e) => updateForm('role', e.target.value)} placeholder="e.g. Lead Electrician" />
          <Input label="Phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
          <Input label="Hourly Rate ($)" type="number" step="0.01" min="0" value={form.rate} onChange={(e) => updateForm('rate', e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
