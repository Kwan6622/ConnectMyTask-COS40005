const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { evaluateTaskRisk } = require('../../src/modules/tasks/riskEvaluator');

dotenv.config({ path: 'database/.env' });
dotenv.config();

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '123456';
const BIDDING_WINDOW_HOURS = 24;

const requesterSeeds = [
  { name: 'Nguyen Minh Anh', email: 'requester1@gmail.com', phone: '0901000001', role: 'REQUESTER', skills: 'Task posting, home services', bio: 'Requester focused on reliable home service providers.', availability: 'Weekdays 8:00 - 18:00', profilePhotoUrl: 'https://res.cloudinary.com/dgwxtzios/image/upload/v1773652699/cgvy9assrqvzfqtfyyg5.png' },
  { name: 'Tran Bao Chau', email: 'requester2@gmail.com', phone: '0901000002', role: 'REQUESTER', skills: 'Office errands, delivery tasks', bio: 'Requester managing office and personal errands.', availability: 'Daily 9:00 - 21:00', profilePhotoUrl: 'https://res.cloudinary.com/dgwxtzios/image/upload/v1773652699/cgvy9assrqvzfqtfyyg5.png' },
  { name: 'Le Quynh Nhu', email: 'requester3@gmail.com', phone: '0901000003', role: 'REQUESTER', skills: 'Family errands and tutoring tasks', bio: 'Requester who posts recurring family support tasks.', availability: 'Daily 7:00 - 22:00', profilePhotoUrl: 'https://res.cloudinary.com/dgwxtzios/image/upload/v1773652699/cgvy9assrqvzfqtfyyg5.png' },
  { name: 'Hoang Minh Duc', email: 'requester4@gmail.com', phone: '0901000004', role: 'REQUESTER', skills: 'Tech and office support requests', bio: 'Requester account for payment-step demo scenarios.', availability: 'Mon-Fri 9:00 - 18:00', profilePhotoUrl: 'https://res.cloudinary.com/dgwxtzios/image/upload/v1773652699/cgvy9assrqvzfqtfyyg5.png' },
  { name: 'Pham Thu Trang', email: 'requester5@gmail.com', phone: '0901000005', role: 'REQUESTER', skills: 'Household services', bio: 'Requester profile used for suspicious-task demo in capstone class.', availability: 'Daily 8:00 - 20:00', profilePhotoUrl: 'https://res.cloudinary.com/dgwxtzios/image/upload/v1773652699/cgvy9assrqvzfqtfyyg5.png' },
];

const providerSeeds = [
  {
    name: 'Le Thanh Dat', email: 'provider1@gmail.com', phone: '0902000001', role: 'PROVIDER', skills: 'HOME_REPAIR',
    bio: '2+ years of home repair and appliance installation experience.', availability: 'Mon-Sat 8:00 - 18:00',
    specialties: ['Electrician', 'Home Repair'], address: '85 Nguyen Thi Minh Khai', district: 'District 3', city: 'Ho Chi Minh City', safetyComplianceAgreed: true,
    certificates: [{ title: 'Electrical vocational certificate', certificateType: 'Electrician Certificate', fileUrl: 'https://example.com/certificates/provider1-electrician.pdf', verificationStatus: 'VERIFIED' }],
  },
  {
    name: 'Pham Gia Han', email: 'provider2@gmail.com', phone: '0902000002', role: 'PROVIDER', skills: 'CLEANING',
    bio: 'Detail-focused cleaner for apartments and small offices.', availability: 'Daily 7:00 - 20:00',
    specialties: ['Cleaning'], address: '212 Dien Bien Phu', district: 'Binh Thanh', city: 'Ho Chi Minh City', safetyComplianceAgreed: true,
    certificates: [{ title: 'Housekeeping training certificate', certificateType: 'Service Qualification', fileUrl: 'https://example.com/certificates/provider2-cleaning.pdf', verificationStatus: 'PENDING' }],
  },
  {
    name: 'Vo Hoang Nam', email: 'provider3@gmail.com', phone: '0902000003', role: 'PROVIDER', skills: 'DELIVERY',
    bio: 'Fast city delivery provider for urgent same-day tasks.', availability: 'Daily 8:00 - 22:00',
    specialties: ['Delivery'], address: '44 Vo Van Kiet', district: 'District 1', city: 'Ho Chi Minh City', safetyComplianceAgreed: true,
    certificates: [{ title: 'Urban delivery operations', certificateType: 'Service Qualification', fileUrl: 'https://example.com/certificates/provider3-delivery.pdf', verificationStatus: 'VERIFIED' }],
  },
  {
    name: 'Bui Kim Ngan', email: 'provider4@gmail.com', phone: '0902000004', role: 'PROVIDER', skills: 'IT_SUPPORT',
    bio: 'Laptop troubleshooting and software setup specialist.', availability: 'Mon-Fri 9:00 - 19:00',
    specialties: ['Tech Support', 'Home Repair'], address: '18 Le Van Sy', district: 'Phu Nhuan', city: 'Ho Chi Minh City', safetyComplianceAgreed: true,
    certificates: [
      { title: 'Computer hardware technician', certificateType: 'Vocational Certificate', fileUrl: 'https://example.com/certificates/provider4-tech.pdf', verificationStatus: 'VERIFIED' },
      { title: 'Electrical safety refresher', certificateType: 'Workplace Safety', fileUrl: 'https://example.com/certificates/provider4-safety.pdf', verificationStatus: 'PENDING' },
    ],
  },
  {
    name: 'Dang Quoc Viet', email: 'provider5@gmail.com', phone: '0902000005', role: 'PROVIDER', skills: 'MOVING',
    bio: 'Furniture moving and heavy-item transport support.', availability: 'Mon-Sun 6:00 - 20:00',
    specialties: ['Moving', 'Delivery'], address: '319 Nguyen Huu Tho', district: 'District 7', city: 'Ho Chi Minh City', safetyComplianceAgreed: true,
    certificates: [{ title: 'Material handling certificate', certificateType: 'Service Qualification', fileUrl: 'https://example.com/certificates/provider5-moving.pdf', verificationStatus: 'REJECTED' }],
  },
];

const districts = ['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 7', 'District 10', 'District 11', 'Binh Thanh', 'Phu Nhuan', 'Go Vap', 'Thu Duc', 'Tan Binh'];

const taskLibrary = {
  DELIVERY: [
    { title: 'Deliver legal documents from District 3 to District 1 (urgent)', desc: 'Chị Minh Anh cần gửi hồ sơ hợp đồng trước 4PM. Tài liệu quan trọng, cần xác nhận người nhận.', min: 70000, max: 140000 },
    { title: 'Pickup medicine and deliver to Binh Thanh', desc: 'Anh Đức cần giao thuốc từ nhà thuốc ở District 10 đến Binh Thanh trong chiều nay.', min: 50000, max: 100000 },
    { title: 'Deliver birthday cake carefully to Thu Duc', desc: 'Bánh kem cho tiệc gia đình, cần giao đúng giờ và giữ nguyên form.', min: 60000, max: 120000 },
    { title: 'Send office parcel from Tan Binh to District 7', desc: 'Gói hàng khoảng 3kg, ưu tiên giao trong giờ hành chính.', min: 50000, max: 110000 },
  ],
  HOME_REPAIR: [
    { title: 'Fix leaking kitchen sink in District 3', desc: 'Bồn rửa bị rò nước ở khớp nối dưới chậu. Cần xử lý dứt điểm trong ngày.', min: 350000, max: 650000 },
    { title: 'Install 2 ceiling fans and test wiring in Go Vap', desc: 'Nhà mới cần lắp 2 quạt trần phòng ngủ và kiểm tra an toàn điện.', min: 700000, max: 1400000 },
    { title: 'Repair bathroom door lock and hinge in District 5', desc: 'Ổ khóa bị kẹt và bản lề phát tiếng kêu. Cần thay linh kiện nếu cần.', min: 350000, max: 700000 },
    { title: 'Unclog toilet and check floor drain in District 11', desc: 'Toilet thoát nước chậm, nghi nghẹt cục bộ. Mong thợ có dụng cụ chuyên dụng.', min: 450000, max: 850000 },
  ],
  CLEANING: [
    { title: 'Clean 2-bedroom apartment in Binh Thanh', desc: 'Dọn tổng quát phòng khách, 2 phòng ngủ, bếp và 2 nhà vệ sinh.', min: 280000, max: 450000 },
    { title: 'Deep cleaning for 3-bedroom apartment in Thu Duc', desc: 'Cần vệ sinh sâu sau 2 tháng không ở, có nhiều bụi khu vực bếp và ban công.', min: 400000, max: 500000 },
    { title: 'Move-out cleaning for studio in District 1', desc: 'Dọn trước khi bàn giao nhà, ưu tiên sạch kính và khu bếp.', min: 200000, max: 350000 },
    { title: 'Office cleaning for small team space in Phu Nhuan', desc: 'Văn phòng 50m2, cần dọn sàn, bàn làm việc, pantry và toilet.', min: 300000, max: 500000 },
  ],
  IT_SUPPORT: [
    { title: 'Laptop cannot connect to WiFi, need urgent fix', desc: 'Máy Windows mất kết nối WiFi từ sáng, cần xử lý onsite tại District 10.', min: 250000, max: 500000 },
    { title: 'Set up printer and scan sharing for 6 PCs', desc: 'Văn phòng nhỏ ở District 1 cần cấu hình in mạng và scan chung.', min: 450000, max: 900000 },
    { title: 'Install SSD and optimize startup for old laptop', desc: 'Máy chạy chậm, cần nâng cấp SSD và cài lại môi trường làm việc cơ bản.', min: 600000, max: 1000000 },
    { title: 'Fix Zoom microphone and camera issue on MacBook', desc: 'Thiết bị không nhận mic/cam trong họp online. Cần khắc phục triệt để.', min: 220000, max: 450000 },
  ],
  PERSONAL_ASSISTANT: [
    { title: 'Personal assistant for grocery and bank errands', desc: 'Cần hỗ trợ 2-3 việc trong buổi sáng tại District 7.', min: 180000, max: 320000 },
    { title: 'Help submit documents and queue at public office', desc: 'Hỗ trợ chờ nộp hồ sơ ở UBND, có thể mất 2-3 tiếng.', min: 200000, max: 380000 },
    { title: 'Half-day household helper in Binh Thanh', desc: 'Sắp xếp đồ đạc, nhận hàng và hỗ trợ một số việc vặt trong nhà.', min: 220000, max: 400000 },
    { title: 'Assist elderly parent to clinic and back home', desc: 'Hỗ trợ di chuyển và làm thủ tục khám tại phòng khám gần nhà.', min: 180000, max: 350000 },
  ],
  MOVING: [
    { title: 'Move furniture from Go Vap to Thu Duc', desc: 'Chuyển 1 giường, 1 tủ áo và 8 thùng đồ. Cần 2 người hỗ trợ.', min: 900000, max: 1800000 },
    { title: 'Move studio apartment items to District 4', desc: 'Đồ gồm bàn làm việc, vali, quạt và 12 thùng carton.', min: 700000, max: 1300000 },
    { title: 'Transport fridge and washing machine to District 5', desc: 'Cần xe tải nhỏ và dụng cụ cố định hàng an toàn.', min: 1000000, max: 2000000 },
    { title: 'Help move office desks from District 1 to Tan Binh', desc: 'Chuyển 4 bàn làm việc và 10 ghế vào cuối tuần.', min: 800000, max: 1600000 },
  ],
  TUTORING: [
    { title: 'English speaking tutor for beginner level', desc: 'Học viên cần luyện giao tiếp 3 buổi/tuần, mỗi buổi 90 phút.', min: 180000, max: 350000 },
    { title: 'Math tutoring for grade 10 student in District 2', desc: 'Ôn đại số và hình học cho kiểm tra giữa kỳ.', min: 200000, max: 400000 },
    { title: 'IELTS writing coaching at home in District 3', desc: 'Mục tiêu 6.5+, cần sửa bài và chiến lược làm bài.', min: 300000, max: 500000 },
    { title: 'Basic coding tutor for high school student', desc: 'Hướng dẫn Python nền tảng trong 2 giờ/buổi.', min: 250000, max: 450000 },
  ],
  OTHER: [
    { title: 'Assemble IKEA table and 2 chairs in District 7', desc: 'Cần người có kinh nghiệm lắp ráp nội thất theo hướng dẫn.', min: 200000, max: 450000 },
    { title: 'Pet sitting for 1 day in Phu Nhuan', desc: 'Trông 1 chó nhỏ từ 9AM đến 6PM, cho ăn và dắt đi dạo 2 lần.', min: 250000, max: 500000 },
    { title: 'Event check-in support for 4 hours in District 1', desc: 'Hỗ trợ đón khách và kiểm tra danh sách tại sự kiện nhỏ.', min: 180000, max: 380000 },
    { title: 'Install blackout curtains in apartment bedroom', desc: 'Khoan lắp thanh treo và chỉnh cân bằng cho 2 bộ rèm.', min: 250000, max: 550000 },
  ],
};

const statusPlan = [
  ...Array(12).fill('OPEN'),
  ...Array(14).fill('BIDDING'),
  ...Array(10).fill('ASSIGNED'),
  ...Array(8).fill('IN_PROGRESS'),
  ...Array(6).fill('COMPLETED'),
];

function randomInRange(min, max, seedIndex) {
  const ratio = ((seedIndex * 73) % 100) / 100;
  return Math.round((min + (max - min) * ratio) / 10000) * 10000;
}

function providerMatchesCategory(category, providers) {
  const map = {
    CLEANING: ['provider2@gmail.com'],
    HOME_REPAIR: ['provider1@gmail.com', 'provider4@gmail.com'],
    DELIVERY: ['provider3@gmail.com', 'provider5@gmail.com'],
    MOVING: ['provider5@gmail.com', 'provider3@gmail.com'],
    IT_SUPPORT: ['provider4@gmail.com', 'provider1@gmail.com'],
    PERSONAL_ASSISTANT: ['provider2@gmail.com', 'provider3@gmail.com'],
    TUTORING: ['provider4@gmail.com', 'provider2@gmail.com'],
  };
  const prioritized = map[category] || providers.map((p) => p.email);
  const providerMap = new Map(providers.map((p) => [p.email, p]));
  const ordered = prioritized.map((email) => providerMap.get(email)).filter(Boolean);
  const rest = providers.filter((p) => !prioritized.includes(p.email));
  return [...ordered, ...rest];
}

function ratingValue(index) {
  const values = [5, 4, 5, 4, 5, 3, 4, 5];
  return values[index % values.length];
}

async function upsertUser(seed, passwordHash) {
  return prisma.user.upsert({
    where: { email: seed.email },
    update: {
      name: seed.name,
      passwordHash,
      role: seed.role,
      phone: seed.phone,
      skills: seed.skills,
      bio: seed.bio || null,
      availability: seed.availability || null,
      profilePhotoUrl: seed.profilePhotoUrl || null,
    },
    create: {
      name: seed.name,
      email: seed.email,
      passwordHash,
      role: seed.role,
      phone: seed.phone,
      skills: seed.skills,
      bio: seed.bio || null,
      availability: seed.availability || null,
      profilePhotoUrl: seed.profilePhotoUrl || null,
    },
  });
}

async function resetTaskData() {
  await prisma.providerCertificate.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.savedTask.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.taskProgressUpdate.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.review.deleteMany();
  await prisma.trackingLog.deleteMany();
  await prisma.aiInsight.deleteMany();
  await prisma.taskSubtask.deleteMany();
  await prisma.task.deleteMany();
}

async function seedProviderProfilesAndCertificates(providers, admin) {
  for (const provider of providers) {
    const providerSeed = providerSeeds.find((item) => item.email === provider.email);
    if (!providerSeed) continue;

    const profile = await prisma.providerProfile.upsert({
      where: { userId: provider.id },
      update: {
        address: providerSeed.address || null,
        district: providerSeed.district || null,
        city: providerSeed.city || null,
        specialties: providerSeed.specialties || [],
        safetyComplianceAgreed: Boolean(providerSeed.safetyComplianceAgreed),
        shortBio: providerSeed.bio || null,
      },
      create: {
        userId: provider.id,
        address: providerSeed.address || null,
        district: providerSeed.district || null,
        city: providerSeed.city || null,
        specialties: providerSeed.specialties || [],
        safetyComplianceAgreed: Boolean(providerSeed.safetyComplianceAgreed),
        shortBio: providerSeed.bio || null,
      },
    });

    for (const cert of providerSeed.certificates || []) {
      await prisma.providerCertificate.create({
        data: {
          providerId: provider.id,
          providerProfileId: profile.id,
          title: cert.title,
          fileUrl: cert.fileUrl,
          certificateType: cert.certificateType,
          verificationStatus: cert.verificationStatus,
          uploadedAt: new Date('2026-03-20T08:00:00.000Z'),
          verifiedAt: cert.verificationStatus === 'PENDING' ? null : new Date('2026-03-22T09:00:00.000Z'),
          verifiedByAdminId: cert.verificationStatus === 'PENDING' ? null : admin.id,
          rejectionReason: cert.verificationStatus === 'REJECTED' ? 'Document quality too blurry for verification.' : null,
        },
      });
    }
  }
}

function buildFiftyTaskDrafts() {
  const categories = Object.keys(taskLibrary);
  const dueOffsets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const baseDueDate = new Date('2026-04-09T09:00:00.000Z');
  const drafts = [];

  for (let i = 0; i < 50; i += 1) {
    const category = categories[i % categories.length];
    const templateSet = taskLibrary[category];
    const template = templateSet[i % templateSet.length];
    const district = districts[i % districts.length];
    const due = new Date(baseDueDate);
    due.setDate(due.getDate() + dueOffsets[i % dueOffsets.length]);
    const createdAt = new Date(due);
    createdAt.setDate(createdAt.getDate() - (1 + (i % 6)));

    drafts.push({
      title: template.title,
      description: `${template.desc} Khu vực ưu tiên: ${district}, TP.HCM.`,
      category,
      location: `${district}, Ho Chi Minh City`,
      dueDate: due,
      createdAt,
      budget: randomInRange(template.min, template.max, i + 1),
      status: statusPlan[i],
      maxBids: 15 + (i % 16),
      seedIndex: i,
    });
  }

  return drafts;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await resetTaskData();

  const requesters = [];
  for (const seed of requesterSeeds) requesters.push(await upsertUser(seed, passwordHash));

  const providers = [];
  for (const seed of providerSeeds) providers.push(await upsertUser(seed, passwordHash));

  const admin = await prisma.user.upsert({
    where: { email: 'admin@connectmytask.local' },
    update: { name: 'System Admin', passwordHash, role: 'ADMIN', phone: '0909999999', bio: 'Admin account for certificate verification.', availability: 'Mon-Fri 9:00 - 18:00' },
    create: { name: 'System Admin', email: 'admin@connectmytask.local', passwordHash, role: 'ADMIN', phone: '0909999999', bio: 'Admin account for certificate verification.', availability: 'Mon-Fri 9:00 - 18:00' },
  });

  await seedProviderProfilesAndCertificates(providers, admin);

  const taskDrafts = buildFiftyTaskDrafts();
  const tasks = [];

  for (const draft of taskDrafts) {
    const requester = requesters[draft.seedIndex % requesters.length];
    const risk = evaluateTaskRisk({
      category: draft.category,
      budget: draft.budget,
      title: draft.title,
      description: draft.description,
    });

    let biddingStartedAt = null;
    let biddingEndsAt = null;
    if (draft.status === 'BIDDING') {
      biddingStartedAt = new Date(draft.createdAt);
      biddingStartedAt.setHours(biddingStartedAt.getHours() + (draft.seedIndex % 10));
      biddingEndsAt = new Date(biddingStartedAt.getTime() + BIDDING_WINDOW_HOURS * 60 * 60 * 1000);
    }

    const task = await prisma.task.create({
      data: {
        title: draft.title,
        description: draft.description,
        category: draft.category,
        budget: draft.budget,
        maxBids: draft.maxBids,
        location: draft.location,
        createdAt: draft.createdAt,
        dueDate: draft.dueDate,
        createdById: requester.id,
        status: draft.status,
        biddingStartedAt,
        biddingEndsAt,
        isSuspicious: risk.isSuspicious,
        suspiciousReason: risk.suspiciousReason,
        riskLevel: risk.riskLevel,
        imageUrls: [],
      },
    });

    tasks.push(task);
  }

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    const matchedProviders = providerMatchesCategory(task.category, providers);

    if (task.status === 'BIDDING') {
      const bidCount = 2 + (i % 3);
      for (let b = 0; b < bidCount; b += 1) {
        const provider = matchedProviders[b % matchedProviders.length];
        await prisma.bid.create({
          data: {
            taskId: task.id,
            providerId: provider.id,
            price: Math.max(100000, Math.round((task.budget * (0.75 + 0.08 * b)) / 10000) * 10000),
            message: `I can support this task with clear updates (${provider.name}).`,
            estimatedCompletionTime: `${2 + b} hours`,
            status: 'PENDING',
          },
        });
      }
    }

    if (['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PAID'].includes(task.status)) {
      const acceptedProvider = matchedProviders[0];
      const acceptedBid = await prisma.bid.create({
        data: {
          taskId: task.id,
          providerId: acceptedProvider.id,
          price: Math.round((task.budget * 0.9) / 10000) * 10000,
          message: 'Ready to execute with required tools and timeline.',
          estimatedCompletionTime: '1 day',
          status: 'ACCEPTED',
        },
      });

      await prisma.bid.create({
        data: {
          taskId: task.id,
          providerId: matchedProviders[1 % matchedProviders.length].id,
          price: Math.round((task.budget * 0.96) / 10000) * 10000,
          message: 'Alternative quote from provider.',
          estimatedCompletionTime: '2 days',
          status: 'REJECTED',
        },
      });

      const updateData = {
        assignedProviderId: acceptedBid.providerId,
        escrowStatus: task.status === 'ASSIGNED' ? 'PENDING_DEPOSIT' : 'HELD',
        paymentStatus: task.status === 'PAID' ? 'RELEASED' : task.status === 'ASSIGNED' ? 'ESCROW_PENDING' : 'ESCROW_HELD',
        escrowAmount: task.budget,
        biddingEndsAt: task.biddingEndsAt || new Date(),
      };

      if (['IN_PROGRESS', 'COMPLETED', 'PAID'].includes(task.status)) {
        updateData.escrowHeldAt = new Date('2026-03-28T08:00:00.000Z');
      }
      if (task.status === 'PAID') {
        updateData.escrowReleasedAt = new Date('2026-03-30T08:00:00.000Z');
      }

      await prisma.task.update({ where: { id: task.id }, data: updateData });

      if (task.status === 'IN_PROGRESS') {
        await prisma.taskProgressUpdate.create({
          data: {
            taskId: task.id,
            providerId: acceptedBid.providerId,
            progressPercent: 60,
            note: 'In progress with milestone updates.',
            milestoneStatus: 'Main execution ongoing',
          },
        });
      }

      if (['COMPLETED', 'PAID'].includes(task.status)) {
        await prisma.taskProgressUpdate.create({
          data: {
            taskId: task.id,
            providerId: acceptedBid.providerId,
            progressPercent: 100,
            note: 'Task completed and handed over.',
            milestoneStatus: 'Completed',
          },
        });

        const requesterRating = ratingValue(i);
        const providerRating = ratingValue(i + 2);

        await prisma.rating.create({
          data: {
            taskId: task.id,
            fromUserId: task.createdById,
            toUserId: acceptedBid.providerId,
            rating: requesterRating,
            comment: requesterRating >= 4
              ? 'Provider was professional and completed work on time.'
              : 'Task completed, but communication could be improved.',
          },
        });

        await prisma.rating.create({
          data: {
            taskId: task.id,
            fromUserId: acceptedBid.providerId,
            toUserId: task.createdById,
            rating: providerRating,
            comment: providerRating >= 4
              ? 'Requester gave clear instructions and smooth confirmation.'
              : 'Requester was responsive enough, with some scope changes.',
          },
        });
      }

      if (task.status === 'PAID') {
        await prisma.paymentTransaction.create({
          data: {
            taskId: task.id,
            payerId: task.createdById,
            providerId: acceptedBid.providerId,
            amount: task.budget,
            totalAmount: task.budget,
            escrowHeldAmount: task.budget,
            platformFeeAmount: Math.round(task.budget * 0.2),
            providerPayoutAmount: Math.round(task.budget * 0.8),
            lifecycleStatus: 'RELEASED',
            method: 'STRIPE',
            type: 'ESCROW_RELEASE',
            escrowStatus: 'RELEASED',
            status: 'SUCCESS',
            heldAt: new Date('2026-03-28T08:00:00.000Z'),
            releasedAt: new Date('2026-03-30T08:00:00.000Z'),
            paidAt: new Date('2026-03-30T08:00:00.000Z'),
            providerTransactionId: `pi_paid_${task.id}`,
            note: 'Seeded released escrow transaction',
          },
        });
      }
    }
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  for (const user of allUsers) {
    const agg = await prisma.rating.aggregate({
      where: { toUserId: user.id },
      _avg: { rating: true },
    });
    await prisma.user.update({ where: { id: user.id }, data: { rating: agg._avg.rating || 0 } });
  }

  const statusSummary = await prisma.task.groupBy({ by: ['status'], _count: { status: true } });

  console.log('Seed completed with fresh dataset');
  console.log('Users:', await prisma.user.count());
  console.log('Tasks:', await prisma.task.count());
  console.log('Status breakdown:', statusSummary);
  console.log('Default credentials:');
  console.log('  requesters/providers/admin password =', DEFAULT_PASSWORD);
  console.log('  admin email = admin@connectmytask.local');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
