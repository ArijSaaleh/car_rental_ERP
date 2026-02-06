import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(agencyId: string | null) {
    // For now, return default settings
    // TODO: Store settings in database and retrieve them
    return {
      general: {
        siteName: 'Car Rental System',
        siteUrl: 'http://localhost:5173',
        contactEmail: 'contact@carrental.com',
        contactPhone: '+216 XX XXX XXX',
      },
      rental: {
        defaultRentalDuration: 1,
        minRentalDuration: 1,
        maxRentalDuration: 30,
        allowSameDayRental: true,
        requireDeposit: true,
        defaultDepositPercentage: 20,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        bookingConfirmation: true,
        paymentReceipt: true,
        reminderBeforePickup: true,
        reminderDaysBeforePickup: 1,
      },
      payment: {
        acceptCash: true,
        acceptCard: true,
        acceptBankTransfer: true,
        requireFullPaymentUpfront: false,
        allowPartialPayment: true,
      },
    };
  }

  async updateSettings(agencyId: string | null, settings: any) {
    // TODO: Implement settings update in database
    // For now, just return the updated settings
    return settings;
  }
}
