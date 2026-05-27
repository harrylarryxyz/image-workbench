import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProvidersService } from './providers.service';

function serviceWithPrisma(prisma: any) {
  return new ProvidersService(prisma);
}

describe('ProvidersService validation', () => {
  it('throws BadRequestException when provider name is missing', async () => {
    const prisma = { providerProfile: { create: vi.fn() } };
    const service = serviceWithPrisma(prisma);

    await expect(service.create({ baseUrl: 'https://api.example.com/v1', apiKey: 'sk-test' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ baseUrl: 'https://api.example.com/v1', apiKey: 'sk-test' })).rejects.toMatchObject({ message: 'name is required' });
    expect(prisma.providerProfile.create).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when provider baseUrl is missing', async () => {
    const prisma = { providerProfile: { create: vi.fn() } };
    const service = serviceWithPrisma(prisma);

    await expect(service.create({ name: 'custom', apiKey: 'sk-test' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ name: 'custom', apiKey: 'sk-test' })).rejects.toMatchObject({ message: 'baseUrl is required' });
    expect(prisma.providerProfile.create).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when provider apiKey is missing', async () => {
    const prisma = { providerProfile: { create: vi.fn() } };
    const service = serviceWithPrisma(prisma);

    await expect(service.create({ name: 'custom', baseUrl: 'https://api.example.com/v1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ name: 'custom', baseUrl: 'https://api.example.com/v1' })).rejects.toMatchObject({ message: 'apiKey is required' });
    expect(prisma.providerProfile.create).not.toHaveBeenCalled();
  });
});
