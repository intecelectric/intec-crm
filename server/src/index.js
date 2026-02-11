require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/crew', require('./routes/crew'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Intec CRM API' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Overdue invoice cron — daily at 8am
cron.schedule('0 8 * * *', async () => {
  try {
    const prisma = require('./utils/prisma');
    const now = new Date();
    const result = await prisma.invoice.updateMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });
    if (result.count > 0) {
      console.log(`[CRON] Marked ${result.count} invoice(s) as OVERDUE`);
    }
  } catch (err) {
    console.error('[CRON] Overdue invoice check failed:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Intec CRM API running on port ${PORT}`);
});

module.exports = app;
