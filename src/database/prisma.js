const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Support both import styles:
// const prisma = require('.../prisma')
// const { prisma } = require('.../prisma')
module.exports = prisma;
module.exports.prisma = prisma;

