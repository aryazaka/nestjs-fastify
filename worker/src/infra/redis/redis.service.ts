// src/common/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    console.log(`Connecting to Redis`);
    this.client = new Redis(redisUrl);
    
    this.client.on('connect', () => console.log('✅ Redis connected'));
    this.client.on('error', (err) => console.error('❌ Redis error:', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Method umum supaya bisa dipakai di service lain:
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<'OK'> {
    if (expireSeconds) {
      return this.client.set(key, value, 'EX', expireSeconds);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  // Expose client kalau mau pakai API lain:
  getClient(): Redis {
    return this.client;
  }
}
