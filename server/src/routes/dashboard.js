const express = require('express');
const prisma = require('../utils/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [
      totalCustomers,
      activeJobs,
      completedJobs,
      totalJobs,
      overdueInvoices,
      invoicesByStatus,
      recentActivities,
      recentJobs,
      workOrders,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.job.count({ where: { status: { in: ['IN_PROGRESS', 'SCHEDULED'] } } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count(),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.invoice.groupBy({
        by: ['status'],
        _sum: { total: true, balanceDue: true },
        _count: true,
      }),
      prisma.activity.findMany({
        include: {
          user: { select: { name: true } },
          job: { select: { jobNumber: true, title: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.job.findMany({
        where: { status: { in: ['IN_PROGRESS', 'SCHEDULED', 'LEAD'] } },
        include: {
          customer: { select: { name: true, company: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.job.count({ where: { isWorkOrder: true, status: 'LEAD' } }),
    ]);

    // Revenue calculations
    const paidInvoices = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true },
    });

    const outstandingBalance = await prisma.invoice.aggregate({
      where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
      _sum: { balanceDue: true },
    });

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    });

    const monthlyRevenue = {};
    monthlyPayments.forEach((p) => {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + parseFloat(p.amount);
    });

    res.json({
      stats: {
        totalCustomers,
        activeJobs,
        completedJobs,
        totalJobs,
        overdueInvoices,
        pendingWorkOrders: workOrders,
        totalRevenue: parseFloat(paidInvoices._sum.total || 0),
        outstandingBalance: parseFloat(outstandingBalance._sum.balanceDue || 0),
      },
      invoicesByStatus,
      recentActivities,
      recentJobs,
      monthlyRevenue,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
