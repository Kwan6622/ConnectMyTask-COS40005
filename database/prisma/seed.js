const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

dotenv.config({ path: 'database/.env' });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const requesterEmail = 'requester@example.com';
  const requesterPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(requesterPassword, 10);

  const requester = await prisma.user.upsert({
    where: { email: requesterEmail },
    update: {
      name: 'Seed Requester',
      passwordHash,
      role: 'REQUESTER',
      phone: '0900000000',
    },
    create: {
      name: 'Seed Requester',
      email: requesterEmail,
      passwordHash,
      role: 'REQUESTER',
      phone: '0900000000',
    },
  });

  const taskTemplates = [
    {
      title: 'Fix leaking kitchen sink',
      description: 'Need a plumber to fix a leaking kitchen sink and check under-sink piping.',
      category: 'HOME_REPAIR',
      budget: 500000,
      location: 'District 3, Ho Chi Minh City',
    },
    {
      title: 'Deep clean apartment',
      description: 'Deep cleaning for 2-bedroom apartment including kitchen and bathrooms.',
      category: 'CLEANING',
      budget: 1200000,
      location: 'Binh Thanh, Ho Chi Minh City',
    },
    {
      title: 'Deliver documents',
      description: 'Deliver a document envelope to District 1 before 4 PM.',
      category: 'DELIVERY',
      budget: 150000,
      location: 'District 1, Ho Chi Minh City',
    },
    {
      title: 'Install air conditioner',
      description: 'Install a new AC unit in bedroom. Unit already purchased.',
      category: 'HOME_REPAIR',
      budget: 800000,
      location: 'Thu Duc, Ho Chi Minh City',
    },
    {
      title: 'Move furniture',
      description: 'Move furniture from old apartment to new apartment. 2 trips.',
      category: 'MOVING',
      budget: 900000,
      location: 'District 7, Ho Chi Minh City',
    },
    {
      title: 'Personal assistant',
      description: 'Need assistance with scheduling and errands for 3 days.',
      category: 'PERSONAL_ASSISTANT',
      budget: 600000,
      location: 'Phu Nhuan, Ho Chi Minh City',
    },
    {
      title: 'Math tutoring',
      description: 'Looking for math tutor for grade 10 student. Twice a week.',
      category: 'TUTORING',
      budget: 400000,
      location: 'Go Vap, Ho Chi Minh City',
    },
    {
      title: 'Laptop repair',
      description: 'Laptop screen replacement and system check.',
      category: 'IT_SUPPORT',
      budget: 700000,
      location: 'District 5, Ho Chi Minh City',
    },
    {
      title: 'Office cleaning weekly',
      description: 'Weekly office cleaning for small office. Prefer weekends.',
      category: 'CLEANING',
      budget: 1500000,
      location: 'District 2, Ho Chi Minh City',
    },
    {
      title: 'Website setup',
      description: 'Basic website setup with 5 pages for a small business.',
      category: 'IT_SUPPORT',
      budget: 3000000,
      location: 'District 1, Ho Chi Minh City',
    },
  ];

  const tasks = await prisma.task.createMany({
    data: taskTemplates.map((task) => ({
      ...task,
      createdById: requester.id,
      status: 'OPEN',
    })),
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed');
  // eslint-disable-next-line no-console
  console.log(`Requester email: ${requesterEmail}`);
  // eslint-disable-next-line no-console
  console.log(`Requester password: ${requesterPassword}`);
  // eslint-disable-next-line no-console
  console.log(`Requester id: ${requester.id}`);
  // eslint-disable-next-line no-console
  console.log(`Tasks created: ${tasks.count}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
