const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/crew
router.get('/', auth, async (req, res) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active !== undefined) where.active = active === 'true';

    const crew = await prisma.crewMember.findMany({
      where,
      include: {
        _count: { select: { jobCrew: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(crew);
  } catch (err) {
    console.error('List crew error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/crew/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const member = await prisma.crewMember.findUnique({
      where: { id: req.params.id },
      include: {
        jobCrew: {
          include: {
            job: { select: { id: true, jobNumber: true, title: true, status: true, scheduledDate: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!member) return res.status(404).json({ error: 'Crew member not found' });
    res.json(member);
  } catch (err) {
    console.error('Get crew member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/crew
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, role, rate } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const member = await prisma.crewMember.create({
      data: { name, phone, email, role, rate: rate || null },
    });

    res.status(201).json(member);
  } catch (err) {
    console.error('Create crew member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/crew/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, email, role, rate, active } = req.body;

    const member = await prisma.crewMember.update({
      where: { id: req.params.id },
      data: { name, phone, email, role, rate, active },
    });

    res.json(member);
  } catch (err) {
    console.error('Update crew member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/crew/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.crewMember.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ message: 'Crew member deactivated' });
  } catch (err) {
    console.error('Delete crew member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
