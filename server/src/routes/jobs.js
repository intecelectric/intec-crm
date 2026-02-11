const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');
const { generateNumber, logActivity } = require('../utils/helpers');

const router = express.Router();

// GET /api/jobs
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, priority, customerId, isWorkOrder, page = 1, limit = 50 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = customerId;
    if (isWorkOrder !== undefined) where.isWorkOrder = isWorkOrder === 'true';

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true } },
          _count: { select: { invoices: true, jobCrew: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/jobs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        lineItems: true,
        invoices: { orderBy: { createdAt: 'desc' } },
        jobCrew: { include: { crew: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, description, status, priority, address, city, state, zip,
      scheduledDate, estimatedAmount, notes, customerId, isWorkOrder,
      workOrderEmail, lineItems,
    } = req.body;

    if (!title || !customerId) {
      return res.status(400).json({ error: 'Title and customer are required' });
    }

    const jobNumber = await generateNumber(prisma, 'job', 'jobNumber', 'JOB');

    const job = await prisma.job.create({
      data: {
        jobNumber,
        title,
        description,
        status: status || 'LEAD',
        priority: priority || 'MEDIUM',
        address, city, state, zip,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        estimatedAmount: estimatedAmount || null,
        notes,
        customerId,
        createdById: req.user.id,
        isWorkOrder: isWorkOrder || false,
        workOrderEmail,
        lineItems: lineItems?.length ? {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice,
            amount: li.amount || li.quantity * li.unitPrice,
          })),
        } : undefined,
      },
      include: { customer: true, lineItems: true },
    });

    await logActivity(prisma, {
      type: 'JOB_CREATED',
      description: `Job ${jobNumber} created: ${title}`,
      jobId: job.id,
      userId: req.user.id,
    });

    // Send work order notification if flagged
    if (job.isWorkOrder) {
      try {
        const { sendWorkOrderNotification } = require('../services/emailService');
        await sendWorkOrderNotification(job);
      } catch (emailErr) {
        console.error('Work order notification failed:', emailErr.message);
      }
    }

    res.status(201).json(job);
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const {
      title, description, status, priority, address, city, state, zip,
      scheduledDate, completedDate, estimatedAmount, actualAmount,
      notes, customerId, isWorkOrder, workOrderEmail, lineItems,
    } = req.body;

    // Handle line items replacement
    if (lineItems) {
      await prisma.jobLineItem.deleteMany({ where: { jobId: req.params.id } });
    }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        title, description, priority,
        address, city, state, zip,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        completedDate: completedDate ? new Date(completedDate) : undefined,
        estimatedAmount, actualAmount, notes, customerId,
        isWorkOrder, workOrderEmail,
        ...(status && { status }),
        lineItems: lineItems ? {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice,
            amount: li.amount || li.quantity * li.unitPrice,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        lineItems: true,
        jobCrew: { include: { crew: true } },
      },
    });

    // Log status change
    if (status && status !== existing.status) {
      await logActivity(prisma, {
        type: 'STATUS_CHANGE',
        description: `Job status changed to ${status}`,
        metadata: { from: existing.status, to: status },
        jobId: job.id,
        userId: req.user.id,
      });
    }

    res.json(job);
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { invoices: true } } },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job._count.invoices > 0) {
      return res.status(400).json({ error: 'Cannot delete job with existing invoices' });
    }

    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs/:id/crew — assign crew member
router.post('/:id/crew', auth, async (req, res) => {
  try {
    const { crewId } = req.body;
    if (!crewId) return res.status(400).json({ error: 'crewId is required' });

    const existing = await prisma.jobCrew.findUnique({
      where: { jobId_crewId: { jobId: req.params.id, crewId } },
    });
    if (existing) return res.status(400).json({ error: 'Crew member already assigned' });

    const assignment = await prisma.jobCrew.create({
      data: { jobId: req.params.id, crewId },
      include: { crew: true },
    });

    await logActivity(prisma, {
      type: 'CREW_ASSIGNED',
      description: `${assignment.crew.name} assigned to job`,
      jobId: req.params.id,
      userId: req.user.id,
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error('Assign crew error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/jobs/:id/crew/:crewId — remove crew member
router.delete('/:id/crew/:crewId', auth, async (req, res) => {
  try {
    await prisma.jobCrew.delete({
      where: { jobId_crewId: { jobId: req.params.id, crewId: req.params.crewId } },
    });
    res.json({ message: 'Crew member removed' });
  } catch (err) {
    console.error('Remove crew error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
