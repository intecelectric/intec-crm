const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/activities
router.get('/', auth, async (req, res) => {
  try {
    const { jobId, invoiceId, type, page = 1, limit = 50 } = req.query;
    const where = {};

    if (jobId) where.jobId = jobId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          job: { select: { id: true, jobNumber: true, title: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({ activities, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List activities error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
