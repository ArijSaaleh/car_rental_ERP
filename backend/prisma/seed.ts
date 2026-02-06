import { PrismaClient, FuelType, TransmissionType, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test agency
  const agency = await prisma.agency.upsert({
    where: { email: 'contact@testdrive.tn' },
    update: {},
    create: {
      name: 'TestDrive Car Rental',
      legalName: 'TestDrive SARL',
      taxId: 'TN123456789',
      email: 'contact@testdrive.tn',
      phone: '+216 71 123 456',
      address: 'Avenue Habib Bourguiba',
      city: 'Tunis',
      postalCode: '1000',
      country: 'Tunisia',
      subscriptionPlan: 'PREMIUM',
      subscriptionStatus: 'active',
      isActive: true,
      currency: 'TND',
      language: 'fr',
      timezone: 'Africa/Tunis',
    },
  });

  console.log('✅ Created agency:', agency.name);

  // Create super admin
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'arij@admin.com' },
    update: {},
    create: {
      email: 'arij@admin.com',
      hashedPassword: hashedPasswordAdmin,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Created super admin:', superAdmin.email);

  // Create agency owner
  const hashedPasswordOwner = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'arij@owner.com' },
    update: {},
    create: {
      email: 'arij@owner.com',
      hashedPassword: hashedPasswordOwner,
      fullName: 'Mohamed Ben Ali',
      phone: '+216 98 123 456',
      role: 'PROPRIETAIRE',
      agencyId: agency.id,
      isActive: true,
      isVerified: true,
    },
  });

  // Update agency with owner
  await prisma.agency.update({
    where: { id: agency.id },
    data: { ownerId: owner.id },
  });

  console.log('✅ Created agency owner:', owner.email);

  // Create manager
  const hashedPasswordManager = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@testdrive.tn' },
    update: {},
    create: {
      email: 'manager@testdrive.tn',
      hashedPassword: hashedPasswordManager,
      fullName: 'Fatma Trabelsi',
      phone: '+216 98 234 567',
      role: 'MANAGER',
      agencyId: agency.id,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Created manager:', manager.email);

  // Create sample vehicles
  const vehicles = [
    {
      licensePlate: 'TUNIS-12345',
      brand: 'Renault',
      model: 'Clio 4',
      year: 2023,
      color: 'White',
      fuelType: FuelType.ESSENCE,
      transmission: TransmissionType.MANUELLE,
      seats: 5,
      doors: 4,
      mileage: 15000,
      status: VehicleStatus.DISPONIBLE,
      dailyRate: '45.000',
      depositAmount: '300.000',
      features: ['Climatisation', 'Radio', 'USB'],
      agency: {
        connect: { id: agency.id },
      },
    },
    {
      licensePlate: 'TUNIS-67890',
      brand: 'Peugeot',
      model: '208',
      year: 2022,
      color: 'Black',
      fuelType: FuelType.DIESEL,
      transmission: TransmissionType.AUTOMATIQUE,
      seats: 5,
      doors: 4,
      mileage: 25000,
      status: VehicleStatus.DISPONIBLE,
      dailyRate: '50.000',
      depositAmount: '350.000',
      features: ['Climatisation', 'GPS', 'Bluetooth', 'Caméra de recul'],
      agency: {
        connect: { id: agency.id },
      },
    },
    {
      licensePlate: 'TUNIS-11111',
      brand: 'Volkswagen',
      model: 'Golf 7',
      year: 2021,
      color: 'Grey',
      fuelType: FuelType.DIESEL,
      transmission: TransmissionType.AUTOMATIQUE,
      seats: 5,
      doors: 4,
      mileage: 45000,
      status: VehicleStatus.DISPONIBLE,
      dailyRate: '55.000',
      depositAmount: '400.000',
      features: ['Climatisation', 'GPS', 'Bluetooth', 'Régulateur de vitesse'],
      agency: {
        connect: { id: agency.id },
      },
    },
  ];

  for (const vehicleData of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { licensePlate: vehicleData.licensePlate },
      update: {},
      create: vehicleData,
    });
    console.log('✅ Created vehicle:', vehicle.brand, vehicle.model);
  }

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Test credentials:');
  console.log('Super Admin: arij@admin.com / admin123');
  console.log('Owner: arij@owner.com / owner123');
  console.log('Manager: manager@testdrive.tn / manager123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
