import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+33612345678' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: '123 Rue de Paris, Paris' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'France' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'AB123456' })
  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @ApiPropertyOptional({ example: 'DL789012' })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
