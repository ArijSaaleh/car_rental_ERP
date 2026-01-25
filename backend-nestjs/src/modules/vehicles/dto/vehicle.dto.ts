import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';
import { FuelType, TransmissionType, VehicleStatus } from '../../../common/enums';

export class CreateVehicleDto {
  @ApiProperty({ example: 'TUNIS-12345' })
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 'VF1234567890ABCDE', required: false })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiProperty({ example: 'Renault' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Clio' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 'White', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ enum: FuelType, example: FuelType.ESSENCE })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ enum: TransmissionType, example: TransmissionType.MANUELLE })
  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  seats?: number;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  doors?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiProperty({ example: '45.500', description: 'Daily rental rate in TND' })
  @IsString()
  dailyRate: string;

  @ApiProperty({ example: '500.000', description: 'Deposit amount in TND', required: false })
  @IsOptional()
  @IsString()
  depositAmount?: string;

  @ApiProperty({ example: ['GPS', 'Climatisation', 'Bluetooth'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ example: ['url1.jpg', 'url2.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Renault' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Clio' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 55000 })
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: '50.000' })
  @IsOptional()
  @IsString()
  dailyRate?: string;

  @ApiPropertyOptional({ example: '500.000' })
  @IsOptional()
  @IsString()
  depositAmount?: string;

  @ApiPropertyOptional({ example: ['GPS', 'Climatisation'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VehicleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;
}
