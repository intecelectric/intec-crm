const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Intec CRM database...');

  // ─── COMPANY SETTINGS ──────────────────────────────────────
  const settings = [
    { key: 'company_name', value: 'Intec Electric' },
    { key: 'company_address', value: '919 N. 25th Ave' },
    { key: 'company_city', value: 'Hollywood' },
    { key: 'company_state', value: 'Florida' },
    { key: 'company_zip', value: '33020' },
    { key: 'company_phone', value: '754-233-4511' },
    { key: 'company_website', value: 'www.intecelectricfl.com' },
    { key: 'company_license', value: 'EC# 13012287' },
    { key: 'company_email', value: 'marcus@intecelectricfl.com' },
    { key: 'support_email', value: 'support@intecelectricfl.com' },
    { key: 'workorder_email', value: 'workorders@intecelectricfl.com' },
    { key: 'default_tax_rate', value: '0' },
    { key: 'invoice_payment_terms', value: 'Net 30' },
    { key: 'invoice_footer_note', value: 'Thank you for choosing Intec Electric! Payment is due within 30 days.' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('  ✓ Settings seeded');

  // ─── ADMIN USER ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('intec2024', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'marcus@intecelectricfl.com' },
    update: {},
    create: {
      email: 'marcus@intecelectricfl.com',
      password: hashedPassword,
      name: 'Marcus',
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'support@intecelectricfl.com' },
    update: {},
    create: {
      email: 'support@intecelectricfl.com',
      password: hashedPassword,
      name: 'Support',
      role: 'STAFF',
    },
  });
  console.log('  ✓ Users seeded');

  // ─── CUSTOMERS (8) ────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Maria Rodriguez',
        email: 'maria.rodriguez@gmail.com',
        phone: '954-555-0101',
        address: '1420 Harrison St',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        type: 'RESIDENTIAL',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'James Wilson',
        email: 'jwilson@wilsonproperties.com',
        phone: '954-555-0102',
        company: 'Wilson Properties LLC',
        address: '3200 N Ocean Dr',
        city: 'Hollywood',
        state: 'FL',
        zip: '33019',
        type: 'PROPERTY_MANAGER',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'David Chen',
        email: 'david@chensrestaurant.com',
        phone: '954-555-0103',
        company: "Chen's Kitchen",
        address: '2501 Hollywood Blvd',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        type: 'COMMERCIAL',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Patricia Banks',
        email: 'pbanks@outlook.com',
        phone: '954-555-0104',
        address: '801 S 21st Ave',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        type: 'RESIDENTIAL',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Robert Taylor',
        email: 'rtaylor@suncoastmgmt.com',
        phone: '954-555-0105',
        company: 'Suncoast Management Group',
        address: '4100 N Federal Hwy, Suite 200',
        city: 'Fort Lauderdale',
        state: 'FL',
        zip: '33308',
        type: 'PROPERTY_MANAGER',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Angela Foster',
        email: 'angela.foster@gmail.com',
        phone: '954-555-0106',
        address: '560 N Surf Rd',
        city: 'Hollywood',
        state: 'FL',
        zip: '33019',
        type: 'RESIDENTIAL',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mike Hernandez',
        email: 'mike@browardautorepair.com',
        phone: '954-555-0107',
        company: 'Broward Auto Repair',
        address: '1800 S State Rd 7',
        city: 'Hollywood',
        state: 'FL',
        zip: '33023',
        type: 'COMMERCIAL',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Susan Park',
        email: 'spark@parkdentalgroup.com',
        phone: '954-555-0108',
        company: 'Park Dental Group',
        address: '3001 Johnson St',
        city: 'Hollywood',
        state: 'FL',
        zip: '33021',
        type: 'COMMERCIAL',
      },
    }),
  ]);
  console.log('  ✓ 8 Customers seeded');

  // ─── CREW MEMBERS (4) ─────────────────────────────────────
  const crew = await Promise.all([
    prisma.crewMember.create({
      data: {
        name: 'Carlos Reyes',
        phone: '954-555-0201',
        email: 'carlos@intecelectricfl.com',
        role: 'Lead Electrician',
        rate: 45.00,
      },
    }),
    prisma.crewMember.create({
      data: {
        name: 'Andre Johnson',
        phone: '954-555-0202',
        email: 'andre@intecelectricfl.com',
        role: 'Journeyman Electrician',
        rate: 38.00,
      },
    }),
    prisma.crewMember.create({
      data: {
        name: 'Tommy Nguyen',
        phone: '954-555-0203',
        email: 'tommy@intecelectricfl.com',
        role: 'Apprentice',
        rate: 22.00,
      },
    }),
    prisma.crewMember.create({
      data: {
        name: 'Diego Ramirez',
        phone: '954-555-0204',
        email: 'diego@intecelectricfl.com',
        role: 'Journeyman Electrician',
        rate: 38.00,
      },
    }),
  ]);
  console.log('  ✓ 4 Crew members seeded');

  // ─── JOBS (8) ──────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

  const jobs = await Promise.all([
    // Job 1 — Completed
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0001',
        title: 'Full Panel Upgrade 200A',
        description: 'Upgrade existing 100A panel to 200A service. Replace meter base, main breaker panel, and all branch circuits.',
        status: 'COMPLETED',
        priority: 'HIGH',
        address: '1420 Harrison St',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        scheduledDate: daysAgo(14),
        completedDate: daysAgo(10),
        estimatedAmount: 4800.00,
        actualAmount: 5100.00,
        customerId: customers[0].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: '200A Main Breaker Panel', quantity: 1, unitPrice: 1200.00, amount: 1200.00 },
            { description: '200A Meter Base', quantity: 1, unitPrice: 450.00, amount: 450.00 },
            { description: 'Copper Wire (Various Gauges)', quantity: 1, unitPrice: 850.00, amount: 850.00 },
            { description: 'Breakers & Hardware', quantity: 1, unitPrice: 600.00, amount: 600.00 },
            { description: 'Labor — Panel Upgrade', quantity: 20, unitPrice: 100.00, amount: 2000.00 },
          ],
        },
      },
    }),
    // Job 2 — In Progress
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0002',
        title: 'Parking Lot Lighting Retrofit',
        description: 'Replace 12 existing HID pole lights with LED fixtures. Includes new photocell controls.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        address: '3200 N Ocean Dr',
        city: 'Hollywood',
        state: 'FL',
        zip: '33019',
        scheduledDate: daysAgo(3),
        estimatedAmount: 8500.00,
        customerId: customers[1].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'LED Pole Light Fixture', quantity: 12, unitPrice: 350.00, amount: 4200.00 },
            { description: 'Photocell Control Unit', quantity: 4, unitPrice: 125.00, amount: 500.00 },
            { description: 'Conduit & Wiring', quantity: 1, unitPrice: 800.00, amount: 800.00 },
            { description: 'Labor — Lighting Install', quantity: 30, unitPrice: 100.00, amount: 3000.00 },
          ],
        },
      },
    }),
    // Job 3 — Scheduled
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0003',
        title: 'Commercial Kitchen Wiring',
        description: 'Wire new commercial kitchen — dedicated circuits for ovens, walk-in cooler, hood system, and general outlets.',
        status: 'SCHEDULED',
        priority: 'HIGH',
        address: '2501 Hollywood Blvd',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        scheduledDate: daysFromNow(5),
        estimatedAmount: 12000.00,
        customerId: customers[2].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'Sub-Panel 100A', quantity: 1, unitPrice: 800.00, amount: 800.00 },
            { description: 'Dedicated 50A Circuit (Ovens)', quantity: 3, unitPrice: 450.00, amount: 1350.00 },
            { description: 'Dedicated 30A Circuit (Cooler)', quantity: 1, unitPrice: 450.00, amount: 450.00 },
            { description: 'General Outlet Circuits', quantity: 6, unitPrice: 200.00, amount: 1200.00 },
            { description: 'Wire, Conduit & Materials', quantity: 1, unitPrice: 2200.00, amount: 2200.00 },
            { description: 'Labor — Commercial Wiring', quantity: 60, unitPrice: 100.00, amount: 6000.00 },
          ],
        },
      },
    }),
    // Job 4 — Quoted / Lead
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0004',
        title: 'Whole-Home Rewire',
        description: 'Complete rewire of 1960s ranch home. Replace all knob-and-tube wiring, add GFCI/AFCI protection.',
        status: 'QUOTED',
        priority: 'MEDIUM',
        address: '801 S 21st Ave',
        city: 'Hollywood',
        state: 'FL',
        zip: '33020',
        estimatedAmount: 15000.00,
        customerId: customers[3].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'Romex NM-B Wire (Various)', quantity: 1, unitPrice: 3200.00, amount: 3200.00 },
            { description: 'New 200A Panel', quantity: 1, unitPrice: 1200.00, amount: 1200.00 },
            { description: 'GFCI/AFCI Breakers', quantity: 20, unitPrice: 55.00, amount: 1100.00 },
            { description: 'Outlets, Switches & Covers', quantity: 1, unitPrice: 1500.00, amount: 1500.00 },
            { description: 'Labor — Whole Home Rewire', quantity: 80, unitPrice: 100.00, amount: 8000.00 },
          ],
        },
      },
    }),
    // Job 5 — In Progress (Property Manager)
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0005',
        title: 'Multi-Unit Smoke Detector Install',
        description: 'Install hardwired interconnected smoke/CO detectors in 24-unit apartment complex per fire marshal requirements.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        address: '4100 N Federal Hwy',
        city: 'Fort Lauderdale',
        state: 'FL',
        zip: '33308',
        scheduledDate: daysAgo(2),
        estimatedAmount: 6200.00,
        customerId: customers[4].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'Hardwired Smoke/CO Detector', quantity: 72, unitPrice: 45.00, amount: 3240.00 },
            { description: 'Wire & Interconnect Cable', quantity: 1, unitPrice: 960.00, amount: 960.00 },
            { description: 'Labor — Detector Install', quantity: 20, unitPrice: 100.00, amount: 2000.00 },
          ],
        },
      },
    }),
    // Job 6 — Completed
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0006',
        title: 'EV Charger Installation',
        description: 'Install Level 2 Tesla Wall Connector in garage. Run dedicated 60A circuit from main panel.',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        address: '560 N Surf Rd',
        city: 'Hollywood',
        state: 'FL',
        zip: '33019',
        scheduledDate: daysAgo(20),
        completedDate: daysAgo(18),
        estimatedAmount: 2200.00,
        actualAmount: 2200.00,
        customerId: customers[5].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'Tesla Wall Connector (Customer Supplied)', quantity: 0, unitPrice: 0, amount: 0 },
            { description: '60A Breaker', quantity: 1, unitPrice: 85.00, amount: 85.00 },
            { description: '6-Gauge Wire (45ft run)', quantity: 1, unitPrice: 315.00, amount: 315.00 },
            { description: 'Conduit & Hardware', quantity: 1, unitPrice: 200.00, amount: 200.00 },
            { description: 'Labor — EV Charger Install', quantity: 16, unitPrice: 100.00, amount: 1600.00 },
          ],
        },
      },
    }),
    // Job 7 — Lead / Work Order
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0007',
        title: 'Auto Shop Lift Circuit',
        description: 'Install dedicated 240V/50A circuit for new hydraulic car lift.',
        status: 'LEAD',
        priority: 'LOW',
        address: '1800 S State Rd 7',
        city: 'Hollywood',
        state: 'FL',
        zip: '33023',
        estimatedAmount: 1800.00,
        isWorkOrder: true,
        workOrderEmail: 'mike@browardautorepair.com',
        customerId: customers[6].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: '50A 2-Pole Breaker', quantity: 1, unitPrice: 65.00, amount: 65.00 },
            { description: '6-Gauge Wire & Conduit', quantity: 1, unitPrice: 435.00, amount: 435.00 },
            { description: '240V Receptacle & Box', quantity: 1, unitPrice: 100.00, amount: 100.00 },
            { description: 'Labor — Circuit Install', quantity: 12, unitPrice: 100.00, amount: 1200.00 },
          ],
        },
      },
    }),
    // Job 8 — Scheduled
    prisma.job.create({
      data: {
        jobNumber: 'JOB-0008',
        title: 'Dental Office Buildout — Electrical',
        description: 'Complete electrical for new dental office buildout — operatory chair circuits, X-ray, compressor, sterilization, and general power/lighting.',
        status: 'SCHEDULED',
        priority: 'HIGH',
        address: '3001 Johnson St',
        city: 'Hollywood',
        state: 'FL',
        zip: '33021',
        scheduledDate: daysFromNow(10),
        estimatedAmount: 18500.00,
        customerId: customers[7].id,
        createdById: admin.id,
        lineItems: {
          create: [
            { description: 'Sub-Panel 200A', quantity: 1, unitPrice: 1400.00, amount: 1400.00 },
            { description: 'Operatory Chair Circuit (Ded.)', quantity: 6, unitPrice: 350.00, amount: 2100.00 },
            { description: 'X-Ray Dedicated Circuit', quantity: 2, unitPrice: 500.00, amount: 1000.00 },
            { description: 'Compressor 240V Circuit', quantity: 1, unitPrice: 450.00, amount: 450.00 },
            { description: 'General Power & Lighting', quantity: 1, unitPrice: 3550.00, amount: 3550.00 },
            { description: 'Wire, Conduit & Materials', quantity: 1, unitPrice: 3000.00, amount: 3000.00 },
            { description: 'Labor — Commercial Buildout', quantity: 70, unitPrice: 100.00, amount: 7000.00 },
          ],
        },
      },
    }),
  ]);
  console.log('  ✓ 8 Jobs seeded');

  // ─── CREW ASSIGNMENTS ──────────────────────────────────────
  await Promise.all([
    // Job 1 (completed) — Carlos + Tommy
    prisma.jobCrew.create({ data: { jobId: jobs[0].id, crewId: crew[0].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[0].id, crewId: crew[2].id } }),
    // Job 2 (in progress) — Andre + Diego
    prisma.jobCrew.create({ data: { jobId: jobs[1].id, crewId: crew[1].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[1].id, crewId: crew[3].id } }),
    // Job 3 (scheduled) — Carlos + Andre + Tommy
    prisma.jobCrew.create({ data: { jobId: jobs[2].id, crewId: crew[0].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[2].id, crewId: crew[1].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[2].id, crewId: crew[2].id } }),
    // Job 5 (in progress) — Carlos + Diego
    prisma.jobCrew.create({ data: { jobId: jobs[4].id, crewId: crew[0].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[4].id, crewId: crew[3].id } }),
    // Job 6 (completed) — Andre
    prisma.jobCrew.create({ data: { jobId: jobs[5].id, crewId: crew[1].id } }),
    // Job 8 (scheduled) — full crew
    prisma.jobCrew.create({ data: { jobId: jobs[7].id, crewId: crew[0].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[7].id, crewId: crew[1].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[7].id, crewId: crew[2].id } }),
    prisma.jobCrew.create({ data: { jobId: jobs[7].id, crewId: crew[3].id } }),
  ]);
  console.log('  ✓ Crew assignments seeded');

  // ─── INVOICES (6) ──────────────────────────────────────────
  const invoices = await Promise.all([
    // Invoice 1 — PAID (Job 1 - Panel Upgrade)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0001',
        status: 'PAID',
        issueDate: daysAgo(10),
        dueDate: daysAgo(10 - 30),
        subtotal: 5100.00,
        taxRate: 0,
        taxAmount: 0,
        total: 5100.00,
        amountPaid: 5100.00,
        balanceDue: 0,
        customerId: customers[0].id,
        jobId: jobs[0].id,
        lineItems: {
          create: [
            { description: '200A Main Breaker Panel', quantity: 1, unitPrice: 1200.00, amount: 1200.00 },
            { description: '200A Meter Base', quantity: 1, unitPrice: 450.00, amount: 450.00 },
            { description: 'Copper Wire (Various Gauges)', quantity: 1, unitPrice: 850.00, amount: 850.00 },
            { description: 'Breakers & Hardware', quantity: 1, unitPrice: 600.00, amount: 600.00 },
            { description: 'Labor — Panel Upgrade', quantity: 20, unitPrice: 100.00, amount: 2000.00 },
          ],
        },
        payments: {
          create: [
            { amount: 5100.00, method: 'CHECK', reference: 'Check #4521', paidAt: daysAgo(7) },
          ],
        },
      },
    }),
    // Invoice 2 — SENT (Job 2 - Parking lot, 50% deposit)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0002',
        status: 'SENT',
        issueDate: daysAgo(5),
        dueDate: daysFromNow(25),
        subtotal: 4250.00,
        taxRate: 0,
        taxAmount: 0,
        total: 4250.00,
        amountPaid: 0,
        balanceDue: 4250.00,
        notes: '50% deposit — balance due upon completion',
        customerId: customers[1].id,
        jobId: jobs[1].id,
        lineItems: {
          create: [
            { description: 'Parking Lot Lighting Retrofit — 50% Deposit', quantity: 1, unitPrice: 4250.00, amount: 4250.00 },
          ],
        },
      },
    }),
    // Invoice 3 — PAID (Job 6 - EV Charger)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0003',
        status: 'PAID',
        issueDate: daysAgo(18),
        dueDate: daysAgo(18 - 30),
        subtotal: 2200.00,
        taxRate: 0,
        taxAmount: 0,
        total: 2200.00,
        amountPaid: 2200.00,
        balanceDue: 0,
        customerId: customers[5].id,
        jobId: jobs[5].id,
        lineItems: {
          create: [
            { description: '60A Breaker', quantity: 1, unitPrice: 85.00, amount: 85.00 },
            { description: '6-Gauge Wire (45ft run)', quantity: 1, unitPrice: 315.00, amount: 315.00 },
            { description: 'Conduit & Hardware', quantity: 1, unitPrice: 200.00, amount: 200.00 },
            { description: 'Labor — EV Charger Install', quantity: 16, unitPrice: 100.00, amount: 1600.00 },
          ],
        },
        payments: {
          create: [
            { amount: 2200.00, method: 'CREDIT_CARD', reference: 'Stripe pi_3abc', paidAt: daysAgo(16) },
          ],
        },
      },
    }),
    // Invoice 4 — OVERDUE (Job 5 - Smoke Detectors deposit)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0004',
        status: 'OVERDUE',
        issueDate: daysAgo(35),
        dueDate: daysAgo(5),
        subtotal: 3100.00,
        taxRate: 0,
        taxAmount: 0,
        total: 3100.00,
        amountPaid: 0,
        balanceDue: 3100.00,
        notes: '50% deposit for smoke detector installation',
        customerId: customers[4].id,
        jobId: jobs[4].id,
        lineItems: {
          create: [
            { description: 'Multi-Unit Smoke Detector Install — 50% Deposit', quantity: 1, unitPrice: 3100.00, amount: 3100.00 },
          ],
        },
      },
    }),
    // Invoice 5 — PARTIAL (old job for Wilson Properties - different project)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0005',
        status: 'PARTIAL',
        issueDate: daysAgo(45),
        dueDate: daysAgo(15),
        subtotal: 6800.00,
        taxRate: 0,
        taxAmount: 0,
        total: 6800.00,
        amountPaid: 3400.00,
        balanceDue: 3400.00,
        notes: 'Previous common-area lighting project',
        customerId: customers[1].id,
        lineItems: {
          create: [
            { description: 'Common Area Lighting — Full Project', quantity: 1, unitPrice: 6800.00, amount: 6800.00 },
          ],
        },
        payments: {
          create: [
            { amount: 3400.00, method: 'BANK_TRANSFER', reference: 'ACH-90812', paidAt: daysAgo(40) },
          ],
        },
      },
    }),
    // Invoice 6 — DRAFT (Job 3 - Kitchen, not sent yet)
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-0006',
        status: 'DRAFT',
        issueDate: now,
        dueDate: daysFromNow(30),
        subtotal: 12000.00,
        taxRate: 0,
        taxAmount: 0,
        total: 12000.00,
        amountPaid: 0,
        balanceDue: 12000.00,
        customerId: customers[2].id,
        jobId: jobs[2].id,
        lineItems: {
          create: [
            { description: 'Sub-Panel 100A', quantity: 1, unitPrice: 800.00, amount: 800.00 },
            { description: 'Dedicated 50A Circuit (Ovens)', quantity: 3, unitPrice: 450.00, amount: 1350.00 },
            { description: 'Dedicated 30A Circuit (Cooler)', quantity: 1, unitPrice: 450.00, amount: 450.00 },
            { description: 'General Outlet Circuits', quantity: 6, unitPrice: 200.00, amount: 1200.00 },
            { description: 'Wire, Conduit & Materials', quantity: 1, unitPrice: 2200.00, amount: 2200.00 },
            { description: 'Labor — Commercial Wiring', quantity: 60, unitPrice: 100.00, amount: 6000.00 },
          ],
        },
      },
    }),
  ]);
  console.log('  ✓ 6 Invoices seeded');

  // ─── ACTIVITY LOG ──────────────────────────────────────────
  const activities = [
    // Job 1 lifecycle
    { type: 'JOB_CREATED', description: 'Job JOB-0001 created: Full Panel Upgrade 200A', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(30) },
    { type: 'STATUS_CHANGE', description: 'Job status changed to SCHEDULED', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(20), metadata: { from: 'LEAD', to: 'SCHEDULED' } },
    { type: 'CREW_ASSIGNED', description: 'Carlos Reyes assigned to job', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(20) },
    { type: 'CREW_ASSIGNED', description: 'Tommy Nguyen assigned to job', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(20) },
    { type: 'STATUS_CHANGE', description: 'Job status changed to IN_PROGRESS', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(14), metadata: { from: 'SCHEDULED', to: 'IN_PROGRESS' } },
    { type: 'STATUS_CHANGE', description: 'Job status changed to COMPLETED', jobId: jobs[0].id, userId: admin.id, createdAt: daysAgo(10), metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' } },
    { type: 'INVOICE_CREATED', description: 'Invoice INV-0001 created for $5,100.00', jobId: jobs[0].id, invoiceId: invoices[0].id, userId: admin.id, createdAt: daysAgo(10) },
    { type: 'INVOICE_SENT', description: 'Invoice INV-0001 sent to maria.rodriguez@gmail.com', invoiceId: invoices[0].id, userId: admin.id, createdAt: daysAgo(10) },
    { type: 'PAYMENT_RECEIVED', description: 'Payment of $5,100.00 received (Check #4521)', invoiceId: invoices[0].id, userId: admin.id, createdAt: daysAgo(7) },

    // Job 2 lifecycle
    { type: 'JOB_CREATED', description: 'Job JOB-0002 created: Parking Lot Lighting Retrofit', jobId: jobs[1].id, userId: admin.id, createdAt: daysAgo(15) },
    { type: 'STATUS_CHANGE', description: 'Job status changed to SCHEDULED', jobId: jobs[1].id, userId: admin.id, createdAt: daysAgo(10), metadata: { from: 'LEAD', to: 'SCHEDULED' } },
    { type: 'STATUS_CHANGE', description: 'Job status changed to IN_PROGRESS', jobId: jobs[1].id, userId: admin.id, createdAt: daysAgo(3), metadata: { from: 'SCHEDULED', to: 'IN_PROGRESS' } },
    { type: 'INVOICE_CREATED', description: 'Invoice INV-0002 created for $4,250.00 (50% deposit)', jobId: jobs[1].id, invoiceId: invoices[1].id, userId: admin.id, createdAt: daysAgo(5) },
    { type: 'INVOICE_SENT', description: 'Invoice INV-0002 sent to jwilson@wilsonproperties.com', invoiceId: invoices[1].id, userId: admin.id, createdAt: daysAgo(5) },

    // Job 5 — urgent smoke detectors
    { type: 'JOB_CREATED', description: 'Job JOB-0005 created: Multi-Unit Smoke Detector Install', jobId: jobs[4].id, userId: admin.id, createdAt: daysAgo(36) },
    { type: 'STATUS_CHANGE', description: 'Job status changed to IN_PROGRESS', jobId: jobs[4].id, userId: admin.id, createdAt: daysAgo(2), metadata: { from: 'SCHEDULED', to: 'IN_PROGRESS' } },

    // Job 6 — EV Charger complete lifecycle
    { type: 'JOB_CREATED', description: 'Job JOB-0006 created: EV Charger Installation', jobId: jobs[5].id, userId: admin.id, createdAt: daysAgo(25) },
    { type: 'STATUS_CHANGE', description: 'Job status changed to COMPLETED', jobId: jobs[5].id, userId: admin.id, createdAt: daysAgo(18), metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' } },
    { type: 'PAYMENT_RECEIVED', description: 'Payment of $2,200.00 received (Credit Card)', invoiceId: invoices[2].id, userId: admin.id, createdAt: daysAgo(16) },

    // Job 7 — work order
    { type: 'WORK_ORDER_RECEIVED', description: 'Work order received from mike@browardautorepair.com', jobId: jobs[6].id, userId: admin.id, createdAt: daysAgo(1) },
    { type: 'JOB_CREATED', description: 'Job JOB-0007 created: Auto Shop Lift Circuit', jobId: jobs[6].id, userId: admin.id, createdAt: daysAgo(1) },
  ];

  for (const a of activities) {
    await prisma.activity.create({ data: a });
  }
  console.log('  ✓ Activity log seeded');

  console.log('\n✅ Seed complete!');
  console.log('   Login: marcus@intecelectricfl.com / intec2024');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
