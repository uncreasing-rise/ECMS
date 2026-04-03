"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const PERMISSIONS = [
    { name: 'users.read', category: 'users', action: 'read' },
    { name: 'users.write', category: 'users', action: 'write' },
    { name: 'branches.read', category: 'branches', action: 'read' },
    { name: 'branches.write', category: 'branches', action: 'write' },
    { name: 'courses.read', category: 'courses', action: 'read' },
    { name: 'courses.write', category: 'courses', action: 'write' },
    { name: 'classes.read', category: 'classes', action: 'read' },
    { name: 'classes.write', category: 'classes', action: 'write' },
    { name: 'enrollments.read', category: 'enrollments', action: 'read' },
    { name: 'enrollments.write', category: 'enrollments', action: 'write' },
    { name: 'finance.read', category: 'finance', action: 'read' },
    { name: 'finance.write', category: 'finance', action: 'write' },
];
async function main() {
    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: {},
            create: { name: perm.name, category: perm.category, action: perm.action },
        });
    }
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin', status: 'active' },
    });
    const saleRole = await prisma.role.upsert({
        where: { name: 'sale' },
        update: {},
        create: { name: 'sale', status: 'active' },
    });
    const teacherRole = await prisma.role.upsert({
        where: { name: 'teacher' },
        update: {},
        create: { name: 'teacher', status: 'active' },
    });
    const permissions = await prisma.permission.findMany();
    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
    }
    const salePermissions = permissions.filter((p) => p.name.startsWith('branches.read') ||
        p.name.startsWith('courses.read') ||
        p.name.startsWith('classes.read') ||
        p.name.startsWith('enrollments.read') ||
        p.name.startsWith('enrollments.write'));
    for (const permission of salePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: saleRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: saleRole.id,
                permissionId: permission.id,
            },
        });
    }
    const teacherPermissions = permissions.filter((p) => p.name.startsWith('classes.read') ||
        p.name.startsWith('enrollments.read'));
    for (const permission of teacherPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: teacherRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: teacherRole.id,
                permissionId: permission.id,
            },
        });
    }
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@ecms.local' },
        update: {},
        create: {
            email: 'admin@ecms.local',
            firstName: 'Admin',
            lastName: 'User',
            accountType: 'staff',
            status: 'active',
        },
    });
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });
    console.log('✓ Seeded roles, permissions, and default admin user.');
    console.log('Email: admin@ecms.local');
    console.log('Name: Admin User');
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map