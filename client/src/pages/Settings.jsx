import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading';
import { Save, Building, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setSettings(data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', settings);
      setSettings(data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building size={18} className="text-accent" />
              <CardTitle>Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company Name" value={settings.company_name || ''} onChange={(e) => update('company_name', e.target.value)} />
              <Input label="Phone" value={settings.company_phone || ''} onChange={(e) => update('company_phone', e.target.value)} />
              <Input label="Address" value={settings.company_address || ''} onChange={(e) => update('company_address', e.target.value)} />
              <Input label="City" value={settings.company_city || ''} onChange={(e) => update('company_city', e.target.value)} />
              <Input label="State" value={settings.company_state || ''} onChange={(e) => update('company_state', e.target.value)} />
              <Input label="ZIP" value={settings.company_zip || ''} onChange={(e) => update('company_zip', e.target.value)} />
              <Input label="Website" value={settings.company_website || ''} onChange={(e) => update('company_website', e.target.value)} />
              <Input label="License Number" value={settings.company_license || ''} onChange={(e) => update('company_license', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              <CardTitle>Email & Invoicing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Main Email" value={settings.company_email || ''} onChange={(e) => update('company_email', e.target.value)} />
              <Input label="Support Email" value={settings.support_email || ''} onChange={(e) => update('support_email', e.target.value)} />
              <Input label="Work Order Inbox" value={settings.workorder_email || ''} onChange={(e) => update('workorder_email', e.target.value)} />
              <Input label="Default Tax Rate (%)" type="number" step="0.01" value={settings.default_tax_rate || ''} onChange={(e) => update('default_tax_rate', e.target.value)} />
              <Input label="Payment Terms" value={settings.invoice_payment_terms || ''} onChange={(e) => update('invoice_payment_terms', e.target.value)} />
              <Textarea label="Invoice Footer Note" value={settings.invoice_footer_note || ''} onChange={(e) => update('invoice_footer_note', e.target.value)} className="sm:col-span-2" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
