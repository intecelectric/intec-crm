const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', auth, async (req, res) => {
  try {
    const { search, type, page = 1, limit = 50 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { jobs: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/customers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        jobs: { orderBy: { createdAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customers
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, company, address, city, state, zip, notes, type } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const customer = await prisma.customer.create({
      data: { name, email, phone, company, address, city, state, zip, notes, type },
    });

    res.status(201).json(customer);
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/customers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, company, address, city, state, zip, notes, type } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, email, phone, company, address, city, state, zip, notes, type },
    });

    res.json(customer);
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check for linked jobs/invoices
    const linked = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { jobs: true, invoices: true } } },
    });

    if (!linked) return res.status(404).json({ error: 'Customer not found' });

    if (linked._count.jobs > 0 || linked._count.invoices > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing jobs or invoices',
      });
    }

    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
