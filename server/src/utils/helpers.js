/**
 * Generate next sequential number like JOB-0001, INV-0002
 */
async function generateNumber(prisma, model, field, prefix) {
  const last = await prisma[model].findFirst({
    orderBy: { [field]: 'desc' },
    select: { [field]: true },
  });

  if (!last) return `${prefix}-0001`;

  const num = parseInt(last[field].split('-')[1], 10);
  return `${prefix}-${String(num + 1).padStart(4, '0')}`;
}

/**
 * Create an activity log entry
 */
async function logActivity(prisma, data) {
  return prisma.activity.create({ data });
}

module.exports = { generateNumber, logActivity };
