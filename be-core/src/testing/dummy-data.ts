import { PrismaClient, Payroll, Role, PayrollStatus, PaymentStatus, EmploymentStatus, AdvanceStatus, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDummyData() {
  console.log('Seeding dummy data...');

  // 1. Create a Dummy Company
  const company = await prisma.company.create({
    data: {
      name: 'PT. Dummy Jaya', 
      emailAdmin: 'admin@dummyjaya.com',
      officePhone: '+628123456789',
      address: 'Jl. Dummy No. 123, Jakarta',
    },
  });
  console.log(`Created Company: ${company.name}`);

  // 2. Create a Dummy HR User (who will initiate payments)
  const hrUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'HR Admin Dummy',
      email: 'hr.admin@dummyjaya.com',
      address: 'Jl. HR Dummy No. 1, Jakarta',
      role: Role.HR,
      contactNumber: '+62876543210',
      passwordHash: 'hashed_password_dummy', // In real app, this would be a proper hash
    },
  });
  console.log(`Created HR User: ${hrUser.name}`);

  // 3. Create Dummy Employees
  const employee1 = await prisma.employee.create({
    data: {
      userId: (await prisma.user.create({
        data: {
          companyId: company.id,
          name: 'Employee One',
          email: 'employee1@dummyjaya.com',
          address: 'Jl. Employee No. 1, Jakarta',
          role: Role.EMPLOYEE,
          contactNumber: '+628111111111',
          passwordHash: 'hashed_password_employee1',
        },
      })).id,
      nik: '1234567890123451',
      status: EmploymentStatus.PERMANENT,
      position: 'Software Engineer',
      joinDate: new Date('2023-01-15'),
      noRekening: 'BCA-1234567890',
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      userId: (await prisma.user.create({
        data: {
          companyId: company.id,
          name: 'Employee Two',
          email: 'employee2@dummyjaya.com',
          address: 'Jl. Employee No. 2, Jakarta',
          role: Role.EMPLOYEE,
          contactNumber: '+628222222222',
          passwordHash: 'hashed_password_employee2',
        },
      })).id,
      nik: '1234567890123452',
      status: EmploymentStatus.CONTRACT,
      position: 'UI/UX Designer',
      joinDate: new Date('2023-03-01'),
      noRekening: 'MANDIRI-0987654321',
    },
  });
  console.log(`Created Employees: ${employee1.nik}, ${employee2.nik}`);

  // 4. Create Payroll Periods
  const payrollPeriod1 = await prisma.payrollPeriod.create({
    data: {
      companyId: company.id,
      periodStart: new Date('2025-01-01T00:00:00Z'),
      periodEnd: new Date('2025-01-31T23:59:59Z'),
      payDate: new Date('2025-02-05T00:00:00Z'),
      status: PayrollStatus.PENDING,
    },
  });

  const payrollPeriod2 = await prisma.payrollPeriod.create({
    data: {
      companyId: company.id,
      periodStart: new Date('2025-02-01T00:00:00Z'),
      periodEnd: new Date('2025-02-28T23:59:59Z'),
      payDate: new Date('2025-03-05T00:00:00Z'),
      status: PayrollStatus.PENDING,
    },
  });

  console.log(`Created Payroll Periods: ${payrollPeriod1.id}, ${payrollPeriod2.id}`);

  // 5. Create Payrolls for Period 1
  const payrollsPeriod1: Payroll[] = [];
  const netSalary1 = 5000000; // Example net salary
  const totalSalary1 = 6000000; // Example total salary
  const payroll1 = await prisma.payroll.create({
    data: {
      employeeId: employee1.id,
      payrollPeriodId: payrollPeriod1.id,
      totalSalary: totalSalary1,
      netSalary: netSalary1,
      status: PaymentStatus.UNPAID,
    },
  });
  payrollsPeriod1.push(payroll1);

  await prisma.payrollComponent.createMany({
    data: [
      { payrollId: payroll1.id, name: 'Gaji Pokok', amount: 4500000, type: 'BASICSALARY' },
      { payrollId: payroll1.id, name: 'Tunjangan Makan', amount: 500000, type: 'ALLOWANCE' },
      { payrollId: payroll1.id, name: 'BPJS Kesehatan', amount: 100000, type: 'DEDUCTION' },
      { payrollId: payroll1.id, name: 'Pajak PPh 21', amount: 900000, type: 'DEDUCTION' },
    ],
  });

  const netSalary2 = 4000000; // Example net salary
  const totalSalary2 = 4800000; // Example total salary
  const payroll2 = await prisma.payroll.create({
    data: {
      employeeId: employee2.id,
      payrollPeriodId: payrollPeriod1.id,
      totalSalary: totalSalary2,
      netSalary: netSalary2,
      status: PaymentStatus.UNPAID,
    },
  });
  payrollsPeriod1.push(payroll2);

  await prisma.payrollComponent.createMany({
    data: [
      { payrollId: payroll2.id, name: 'Gaji Pokok', amount: 3800000, type: 'BASICSALARY' },
      { payrollId: payroll2.id, name: 'Tunjangan Transport', amount: 200000, type: 'ALLOWANCE' },
      { payrollId: payroll2.id, name: 'Pajak PPh 21', amount: 800000, type: 'DEDUCTION' },
    ],
  });

  console.log(`Created ${payrollsPeriod1.length} Payrolls for Payroll Period ${payrollPeriod1.id}`);

  console.log('Dummy data seeding complete.');
  return { company, hrUser, employee1, employee2, payrollPeriod1, payrollPeriod2, payrollsPeriod1 };
}