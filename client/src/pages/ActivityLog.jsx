import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading';
import { formatRelative, formatStatus } from '@/lib/format';
import {
  Activity, Briefcase, FileText, DollarSign, Users, HardHat,
  Mail, Inbox, MessageSquare, RefreshCw
} from 'lucide-react';

const typeIcons = {
  STATUS_CHANGE: RefreshCw,
  NOTE_ADDED: MessageSquare,
  INVOICE_CREATED: FileText,
  INVOICE_SENT: Mail,
  PAYMENT_RECEIVED: DollarSign,
  JOB_CREATED: Briefcase,
  JOB_UPDATED: Briefcase,
  CREW_ASSIGNED: HardHat,
  EMAIL_SENT: Mail,
  WORK_ORDER_RECEIVED: Inbox,
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/activities', { params: { limit: 100 } })
      .then(({ data }) => { setActivities(data.activities); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Activity Log</h1>
        <p className="text-sm text-text-muted">{total} total events</p>
      </div>

      <Card className="divide-y divide-border/50">
        {activities.length === 0 && <p className="text-sm text-text-muted p-4">No activity yet</p>}
        {activities.map((act) => {
          const Icon = typeIcons[act.type] || Activity;
          return (
            <div key={act.id} className="flex items-start gap-3 p-4">
              <div className="p-1.5 rounded-lg bg-surface-light text-text-muted shrink-0">
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">{act.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {act.job && (
                    <Link to={`/jobs/${act.job.id}`} className="text-xs text-accent hover:underline">{act.job.jobNumber}</Link>
                  )}
                  {act.invoice && (
                    <Link to={`/invoices/${act.invoice.id}`} className="text-xs text-accent hover:underline">{act.invoice.invoiceNumber}</Link>
                  )}
                  {act.user && <span className="text-xs text-text-muted">by {act.user.name}</span>}
                  <span className="text-xs text-text-muted">{formatRelative(act.createdAt)}</span>
                </div>
              </div>
              <Badge variant={act.type === 'STATUS_CHANGE' ? 'SCHEDULED' : undefined} className="shrink-0 text-[10px]">
                {formatStatus(act.type)}
              </Badge>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
