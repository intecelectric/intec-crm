import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelative(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPhone(phone) {
  if (!phone) return '—';
  return phone;
}

export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ');
}
