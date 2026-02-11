const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');
const { generateNumber, logActivity } = require('../utils/helpers');

const router = express.Router();

// GET /api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, customerId, jobId, page = 1, limit = 50 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (jobId) where.jobId = jobId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true, email: true } },
          job: { select: { id: true, jobNumber: true, title: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        job: { select: { id: true, jobNumber: true, title: true } },
        lineItems: true,
        payments: { orderBy: { paidAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', auth, async (req, res) => {
  try {
    const {
      customerId, jobId, issueDate, dueDate, taxRate, notes, lineItems,
      qbCustomerId, qbInvoiceId,
    } = req.body;

    if (!customerId || !lineItems?.length) {
      return res.status(400).json({ error: 'Customer and at least one line item required' });
    }

    const invoiceNumber = await generateNumber(prisma, 'invoice', 'invoiceNumber', 'INV');

    const subtotal = lineItems.reduce((sum, li) => {
      const amt = li.amount || (li.quantity || 1) * li.unitPrice;
      return sum + parseFloat(amt);
    }, 0);
    const rate = parseFloat(taxRate || 0);
    const taxAmount = subtotal * (rate / 100);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: 'DRAFT',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000),
        subtotal,
        taxRate: rate,
        taxAmount,
        total,
        amountPaid: 0,
        balanceDue: total,
        notes,
        customerId,
        jobId: jobId || null,
        qbCustomerId,
        qbInvoiceId,
        lineItems: {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice,
            amount: li.amount || (li.quantity || 1) * li.unitPrice,
          })),
        },
      },
      include: { customer: true, lineItems: true, job: true },
    });

    await logActivity(prisma, {
      type: 'INVOICE_CREATED',
      description: `Invoice ${invoiceNumber} created for $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      invoiceId: invoice.id,
      jobId: jobId || null,
      userId: req.user.id,
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const {
      status, issueDate, dueDate, taxRate, notes, lineItems,
      qbCustomerId, qbInvoiceId,
    } = req.body;

    let updateData = {
      notes, qbCustomerId, qbInvoiceId,
    };

    if (issueDate) updateData.issueDate = new Date(issueDate);
    if (dueDate) updateData.dueDate = new Date(dueDate);

    // Recalculate totals if line items changed
    if (lineItems) {
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: req.params.id } });

      const subtotal = lineItems.reduce((sum, li) => {
        const amt = li.amount || (li.quantity || 1) * li.unitPrice;
        return sum + parseFloat(amt);
      }, 0);
      const rate = parseFloat(taxRate ?? existing.taxRate);
      const taxAmount = subtotal * (rate / 100);
      const total = subtotal + taxAmount;
      const balanceDue = total - parseFloat(existing.amountPaid);

      updateData = {
        ...updateData,
        subtotal, taxRate: rate, taxAmount, total, balanceDue,
        lineItems: {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice,
            amount: li.amount || (li.quantity || 1) * li.unitPrice,
          })),
        },
      };
    }

    if (status) {
      updateData.status = status;
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: { customer: true, lineItems: true, job: true, payments: true },
    });

    if (status && status !== existing.status) {
      await logActivity(prisma, {
        type: 'STATUS_CHANGE',
        description: `Invoice status changed to ${status}`,
        metadata: { from: existing.status, to: status },
        invoiceId: invoice.id,
        userId: req.user.id,
      });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot delete a paid invoice' });
    }

    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/payments — record a payment
router.post('/:id/payments', auth, async (req, res) => {
  try {
    const { amount, method, reference, notes, paidAt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required' });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        method: method || 'CHECK',
        reference,
        notes,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        invoiceId: req.params.id,
      },
    });

    const newAmountPaid = parseFloat(invoice.amountPaid) + parseFloat(amount);
    const newBalanceDue = parseFloat(invoice.total) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
      },
    });

    await logActivity(prisma, {
      type: 'PAYMENT_RECEIVED',
      description: `Payment of $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} received${reference ? ` (${reference})` : ''}`,
      invoiceId: req.params.id,
      userId: req.user.id,
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('Record payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/send — send invoice email + mark as sent
router.post('/:id/send', auth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Attempt to send email with PDF attachment
    let emailResult = { skipped: true };
    try {
      const { sendInvoiceEmail } = require('../services/emailService');
      emailResult = await sendInvoiceEmail(req.params.id, { attachPdf: true });
    } catch (emailErr) {
      console.error('Email send failed (invoice still marked sent):', emailErr.message);
    }

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    await logActivity(prisma, {
      type: 'INVOICE_SENT',
      description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customer.email || 'customer'}`,
      invoiceId: req.params.id,
      userId: req.user.id,
    });

    res.json({
      message: emailResult.skipped ? 'Invoice marked as sent (email not configured)' : 'Invoice sent via email',
      emailSent: !emailResult.skipped,
    });
  } catch (err) {
    console.error('Send invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id/pdf — generate and download PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const { generateInvoicePdf } = require('../services/pdfService');
    const { pdf, invoice } = await generateInvoicePdf(req.params.id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
