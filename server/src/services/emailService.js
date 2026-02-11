const { Resend } = require('resend');
const prisma = require('../utils/prisma');

let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function getSettings() {
  const rows = await prisma.setting.findMany();
  const s = {};
  rows.forEach((r) => { s[r.key] = r.value; });
  return s;
}

const FROM = process.env.EMAIL_FROM || 'marcus@intecelectricfl.com';

/**
 * Send invoice email to customer with optional PDF attachment
 */
async function sendInvoiceEmail(invoiceId, opts = {}) {
  const r = getResend();
  if (!r) {
    console.warn('[EMAIL] Resend not configured — skipping email');
    return { skipped: true };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      job: { select: { jobNumber: true, title: true } },
      lineItems: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');
  if (!invoice.customer.email) throw new Error('Customer has no email address');

  const settings = await getSettings();
  const companyName = settings.company_name || 'Intec Electric';
  const companyPhone = settings.company_phone || '754-233-4511';

  const lineItemsHtml = invoice.lineItems.map((li) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">${li.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#666;">${parseFloat(li.quantity)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">$${parseFloat(li.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#E8510A;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;">${companyName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Licensed Electrical Contractor</p>
      </div>

      <div style="background:#ffffff;padding:32px;border:1px solid #e5e5e5;border-top:none;">
        <p style="font-size:15px;margin:0 0 16px;">Hi ${invoice.customer.name.split(' ')[0]},</p>
        <p style="font-size:15px;margin:0 0 24px;">
          Please find your invoice <strong>${invoice.invoiceNumber}</strong> attached below.
          ${invoice.job ? `This is for <strong>${invoice.job.jobNumber} — ${invoice.job.title}</strong>.` : ''}
        </p>

        <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;color:#666;">Invoice</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;">Issue Date</td>
              <td style="padding:4px 0;text-align:right;">${new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;">Due Date</td>
              <td style="padding:4px 0;text-align:right;">${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
            </tr>
            <tr style="border-top:1px solid #e5e5e5;">
              <td style="padding:10px 0 4px;font-weight:600;font-size:16px;">Balance Due</td>
              <td style="padding:10px 0 4px;text-align:right;font-weight:700;font-size:18px;color:#E8510A;">$${parseFloat(invoice.balanceDue).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:2px solid #e5e5e5;">
              <th style="padding:8px 12px;text-align:left;color:#999;font-size:11px;text-transform:uppercase;">Description</th>
              <th style="padding:8px 12px;text-align:center;color:#999;font-size:11px;text-transform:uppercase;">Qty</th>
              <th style="padding:8px 12px;text-align:right;color:#999;font-size:11px;text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>${lineItemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:600;">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px;">$${parseFloat(invoice.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p style="font-size:13px;color:#666;margin:0;">
          If you have any questions, reply to this email or call us at <strong>${companyPhone}</strong>.
        </p>
      </div>

      <div style="padding:16px 32px;text-align:center;font-size:12px;color:#999;">
        ${companyName} &nbsp;|&nbsp; ${settings.company_address || ''}, ${settings.company_city || ''}, ${settings.company_state || ''} ${settings.company_zip || ''}<br>
        ${settings.company_website || ''} &nbsp;|&nbsp; License: ${settings.company_license || ''}
      </div>
    </div>
  `;

  // Build attachments
  const attachments = [];
  if (opts.attachPdf) {
    try {
      const { generateInvoicePdf } = require('./pdfService');
      const { pdf } = await generateInvoicePdf(invoiceId);
      attachments.push({
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdf,
      });
    } catch (err) {
      console.error('[EMAIL] PDF attachment failed:', err.message);
    }
  }

  const result = await r.emails.send({
    from: `${companyName} <${FROM}>`,
    to: [invoice.customer.email],
    subject: `Invoice ${invoice.invoiceNumber} from ${companyName} — $${parseFloat(invoice.balanceDue).toFixed(2)} due`,
    html,
    attachments,
  });

  return result;
}

/**
 * Send a generic notification email
 */
async function sendNotificationEmail({ to, subject, body }) {
  const r = getResend();
  if (!r) {
    console.warn('[EMAIL] Resend not configured — skipping email');
    return { skipped: true };
  }

  const settings = await getSettings();
  const companyName = settings.company_name || 'Intec Electric';

  const result = await r.emails.send({
    from: `${companyName} <${FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#E8510A;padding:20px 28px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">${companyName}</h2>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
          ${body}
        </div>
      </div>
    `,
  });

  return result;
}

/**
 * Send work order received notification to the company inbox
 */
async function sendWorkOrderNotification(job) {
  const settings = await getSettings();
  const workorderEmail = settings.workorder_email || 'workorders@intecelectricfl.com';

  return sendNotificationEmail({
    to: workorderEmail,
    subject: `New Work Order: ${job.jobNumber} — ${job.title}`,
    body: `
      <p style="font-size:15px;">A new work order has been received and logged.</p>
      <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:16px 0;">
        <p><strong>Job:</strong> ${job.jobNumber}</p>
        <p><strong>Title:</strong> ${job.title}</p>
        <p><strong>Customer:</strong> ${job.customer?.name || 'N/A'}</p>
        ${job.description ? `<p><strong>Description:</strong> ${job.description}</p>` : ''}
        ${job.workOrderEmail ? `<p><strong>From:</strong> ${job.workOrderEmail}</p>` : ''}
      </div>
      <p style="font-size:13px;color:#666;">Log in to the CRM to review and schedule this work order.</p>
    `,
  });
}

module.exports = {
  sendInvoiceEmail,
  sendNotificationEmail,
  sendWorkOrderNotification,
};
