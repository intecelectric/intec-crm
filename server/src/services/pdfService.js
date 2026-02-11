const puppeteer = require('puppeteer');
const prisma = require('../utils/prisma');

async function generateInvoiceHtml(invoice, settings) {
  const s = settings;
  const lineItemsHtml = invoice.lineItems.map((li) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;">${li.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:center;color:#a0a0a0;">${parseFloat(li.quantity)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:right;color:#a0a0a0;">$${parseFloat(li.unitPrice).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:right;color:#f5f5f5;font-weight:500;">$${parseFloat(li.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  const paymentsHtml = invoice.payments?.length ? `
    <div style="margin-top:24px;">
      <h3 style="font-family:'Syne',sans-serif;font-size:14px;color:#a0a0a0;margin-bottom:8px;">Payment History</h3>
      ${invoice.payments.map((p) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e1e1e;font-size:13px;">
          <span style="color:#22c55e;">$${parseFloat(p.amount).toFixed(2)} — ${p.method.replace(/_/g,' ')}${p.reference ? ' (' + p.reference + ')' : ''}</span>
          <span style="color:#666;">${new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const taxRow = parseFloat(invoice.taxAmount) > 0 ? `
    <tr>
      <td style="padding:6px 12px;text-align:right;color:#a0a0a0;">Tax (${invoice.taxRate}%)</td>
      <td style="padding:6px 12px;text-align:right;color:#f5f5f5;">$${parseFloat(invoice.taxAmount).toFixed(2)}</td>
    </tr>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; background:#0f0f0f; color:#f5f5f5; padding:40px; }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto;background:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:32px 40px;border-bottom:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <div style="width:36px;height:36px;background:#E8510A;border-radius:8px;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#f5f5f5;">${s.company_name || 'Intec Electric'}</span>
        </div>
        <div style="font-size:13px;color:#a0a0a0;line-height:1.6;margin-top:8px;">
          ${s.company_address || ''}, ${s.company_city || ''}, ${s.company_state || ''} ${s.company_zip || ''}<br>
          ${s.company_phone || ''} &nbsp;|&nbsp; ${s.company_email || ''}<br>
          ${s.company_website || ''} &nbsp;|&nbsp; License: ${s.company_license || ''}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:#E8510A;">INVOICE</div>
        <div style="font-size:18px;font-weight:600;color:#f5f5f5;margin-top:4px;">${invoice.invoiceNumber}</div>
        <div style="font-size:13px;color:#a0a0a0;margin-top:8px;">
          Status: <span style="color:${invoice.status === 'PAID' ? '#22c55e' : invoice.status === 'OVERDUE' ? '#ef4444' : '#E8510A'};font-weight:600;">${invoice.status}</span>
        </div>
      </div>
    </div>

    <!-- Bill To + Dates -->
    <div style="padding:24px 40px;display:flex;justify-content:space-between;border-bottom:1px solid #2a2a2a;">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">Bill To</div>
        <div style="font-size:15px;font-weight:600;color:#f5f5f5;">${invoice.customer.name}</div>
        ${invoice.customer.company ? `<div style="font-size:13px;color:#a0a0a0;">${invoice.customer.company}</div>` : ''}
        ${invoice.customer.address ? `<div style="font-size:13px;color:#a0a0a0;">${invoice.customer.address}</div>` : ''}
        ${invoice.customer.city ? `<div style="font-size:13px;color:#a0a0a0;">${invoice.customer.city}, ${invoice.customer.state || ''} ${invoice.customer.zip || ''}</div>` : ''}
        ${invoice.customer.email ? `<div style="font-size:13px;color:#a0a0a0;margin-top:4px;">${invoice.customer.email}</div>` : ''}
        ${invoice.customer.phone ? `<div style="font-size:13px;color:#a0a0a0;">${invoice.customer.phone}</div>` : ''}
      </div>
      <div style="text-align:right;">
        ${invoice.job ? `<div style="margin-bottom:8px;"><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Job</span><br><span style="font-size:14px;color:#E8510A;font-weight:500;">${invoice.job.jobNumber} — ${invoice.job.title}</span></div>` : ''}
        <div style="margin-bottom:4px;"><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Issue Date</span><br><span style="font-size:14px;color:#f5f5f5;">${new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
        <div style="margin-top:8px;"><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Due Date</span><br><span style="font-size:14px;color:#f5f5f5;">${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
      </div>
    </div>

    <!-- Line Items -->
    <div style="padding:0 40px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:24px;">
        <thead>
          <tr style="border-bottom:2px solid #2a2a2a;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Description</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:20px 40px 0;display:flex;justify-content:flex-end;">
      <table style="font-size:14px;min-width:280px;">
        <tr>
          <td style="padding:6px 12px;text-align:right;color:#a0a0a0;">Subtotal</td>
          <td style="padding:6px 12px;text-align:right;color:#f5f5f5;">$${parseFloat(invoice.subtotal).toFixed(2)}</td>
        </tr>
        ${taxRow}
        <tr style="border-top:2px solid #2a2a2a;">
          <td style="padding:10px 12px;text-align:right;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#f5f5f5;">Total</td>
          <td style="padding:10px 12px;text-align:right;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#f5f5f5;">$${parseFloat(invoice.total).toFixed(2)}</td>
        </tr>
        ${parseFloat(invoice.amountPaid) > 0 ? `
        <tr>
          <td style="padding:6px 12px;text-align:right;color:#22c55e;">Paid</td>
          <td style="padding:6px 12px;text-align:right;color:#22c55e;">-$${parseFloat(invoice.amountPaid).toFixed(2)}</td>
        </tr>` : ''}
        <tr style="border-top:1px solid #2a2a2a;">
          <td style="padding:10px 12px;text-align:right;font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:${parseFloat(invoice.balanceDue) > 0 ? '#E8510A' : '#22c55e'};">Balance Due</td>
          <td style="padding:10px 12px;text-align:right;font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:${parseFloat(invoice.balanceDue) > 0 ? '#E8510A' : '#22c55e'};">$${parseFloat(invoice.balanceDue).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${paymentsHtml ? `<div style="padding:0 40px;">${paymentsHtml}</div>` : ''}

    <!-- Notes -->
    ${invoice.notes ? `
    <div style="padding:20px 40px 0;">
      <div style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:8px;padding:16px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px;">Notes</div>
        <div style="font-size:13px;color:#a0a0a0;">${invoice.notes}</div>
      </div>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:24px 40px 32px;margin-top:20px;border-top:1px solid #2a2a2a;text-align:center;">
      <div style="font-size:13px;color:#a0a0a0;">${s.invoice_footer_note || 'Thank you for choosing Intec Electric!'}</div>
      <div style="font-size:11px;color:#666;margin-top:6px;">${s.invoice_payment_terms || 'Net 30'} &nbsp;|&nbsp; ${s.company_phone || ''} &nbsp;|&nbsp; ${s.company_email || ''}</div>
    </div>
  </div>
</body>
</html>`;
}

async function generateInvoicePdf(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      job: { select: { id: true, jobNumber: true, title: true } },
      lineItems: true,
      payments: { orderBy: { paidAt: 'desc' } },
    },
  });

  if (!invoice) throw new Error('Invoice not found');

  // Load company settings
  const settingsRows = await prisma.setting.findMany();
  const settings = {};
  settingsRows.forEach((s) => { settings[s.key] = s.value; });

  const html = await generateInvoiceHtml(invoice, settings);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    return { pdf, invoice };
  } finally {
    await browser.close();
  }
}

module.exports = { generateInvoicePdf };
