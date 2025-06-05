import { createClient, RedisClientType, RedisClientOptions, SetOptions } from 'redis';
import winston from 'winston';

// Basic logger configuration (can be enhanced or moved to a shared logger utility)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log stack traces
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'redis-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Add file transport for production if needed
    // new winston.transports.File({ filename: 'logs/redis-error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/redis-combined.log' }),
  ],
});

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

class RedisService {
  private client: RedisClientType;
  private _isConnected: boolean = false;
  private readonly defaultTTL: number = 3600; // 1 hour
  private readonly defaultKeyPrefix: string = 'planner-suite:';
  
  // Specific prefixes for different use cases
  public readonly prefixes = {
    cache: `${this.defaultKeyPrefix}cache:`,
    session: `${this.defaultKeyPrefix}session:`,
    rateLimit: `${this.defaultKeyPrefix}rl:`, // For rate-limit-redis, ensure this matches its config
    blacklist: `${this.defaultKeyPrefix}blacklist:`,
    locks: `${this.defaultKeyPrefix}locks:`,
  };


  constructor(options?: RedisClientOptions) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const clientOptions: RedisClientOptions = {
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff with a cap
          const delay = Math.min(50 + retries * 500, 5000); 
          logger.warn(`Redis: Reconnexion en cours (tentative ${retries + 1}). Prochaine tentative dans ${delay}ms.`);
          return delay;
        },
        connectTimeout: 10000, // 10 seconds
      },
      pingInterval: 60000, // Ping every 60 seconds to keep connection alive
      ...options,
    };

    this.client = createClient(clientOptions) as RedisClientType;

    this.client.on('connect', () => {
      logger.info('Redis: Connexion établie avec le serveur.');
      this._isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis: Client prêt à exécuter des commandes.');
      this._isConnected = true; // Ensure this is true on ready as well
    });
    
    this.client.on('end', () => {
      logger.info('Redis: Connexion fermée.');
      this._isConnected = false;
    });

    this.client.on('error', (err) => {
      logger.error('Redis: Erreur client.', { error: err.message, stack: err.stack });
      // Note: 'error' event usually means the connection is lost or a command failed critically.
      // The client might attempt to reconnect based on reconnectStrategy.
      // If it was connected, mark as disconnected.
      if (this._isConnected) {
        this._isConnected = false;
      }
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis: Tentative de reconnexion...');
      this._isConnected = false; // Mark as not connected during reconnection attempts
    });

    // Initiate connection
    this.connect().catch(err => {
        logger.error('Redis: Échec de la connexion initiale.', { error: err.message });
    });
  }

  public async connect(): Promise<void> {
    if (!this._isConnected && !this.client.isOpen) {
      try {
        logger.info('Redis: Connexion en cours...');
        await this.client.connect();
      } catch (err) {
        logger.error('Redis: Erreur lors de la tentative de connexion explicite.', { error: (err as Error).message });
        // The 'error' event on the client will also fire.
        throw err; // Re-throw to allow caller to handle if needed
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this._isConnected && this.client.isOpen) {
      try {
        logger.info('Redis: Déconnexion en cours...');
        await this.client.quit(); // Graceful shutdown
        this._isConnected = false;
      } catch (err) {
        logger.error('Redis: Erreur lors de la déconnexion.', { error: (err as Error).message });
        // Force close if quit fails
        await this.client.disconnect();
        this._isConnected = false;
      }
    }
  }

  get isReady(): boolean {
    return this._isConnected && this.client.isReady;
  }

  // Required by rate-limit-redis
  public async sendCommand<T = unknown>(args: string[], options?: any): Promise<T> {
    if (!this.isReady) {
      await this.connect(); // Attempt to reconnect if not ready
      if(!this.isReady) throw new Error('Redis client is not connected or not ready.');
    }
    // @ts-ignore - The sendCommand signature in redis v4 is slightly different
    return this.client.sendCommand(args, options) as Promise<T>;
  }

  private getKey(key: string, prefix?: string): string {
    return `${prefix || this.defaultKeyPrefix}${key}`;
  }

  public async get(key: string, prefix?: string): Promise<string | null> {
    if (!this.isReady) return null;
    try {
      const fullKey = this.getKey(key, prefix);
      const value = await this.client.get(fullKey);
      logger.debug(`Redis GET: ${fullKey} - ${value ? 'Hit' : 'Miss'}`);
      return value;
    } catch (err) {
      logger.error(`Redis GET Error: ${key}`, { error: (err as Error).message });
      return null;
    }
  }

  public async getObject<T>(key: string, prefix?: string): Promise<T | null> {
    const value = await this.get(key, prefix);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch (err) {
      logger.error(`Redis JSON.parse Error: ${key}`, { value, error: (err as Error).message });
      return null;
    }
  }

  public async set(key: string, value: string | number | object, options?: CacheOptions): Promise<boolean> {
    if (!this.isReady) return false;
    try {
      const fullKey = this.getKey(key, options?.prefix);
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const setOpts: SetOptions = {};
      if (options?.ttl !== undefined) {
        setOpts.EX = options.ttl;
      } else {
        setOpts.EX = this.defaultTTL;
      }
      
      const result = await this.client.set(fullKey, stringValue, setOpts);
      logger.debug(`Redis SET: ${fullKey}, TTL: ${setOpts.EX}s - Result: ${result}`);
      return result === 'OK';
    } catch (err) {
      logger.error(`Redis SET Error: ${key}`, { error: (err as Error).message });
      return false;
    }
  }

  public async delete(key: string, prefix?: string): Promise<number> {
    if (!this.isReady) return 0;
    try {
      const fullKey = this.getKey(key, prefix);
      const result = await this.client.del(fullKey);
      logger.debug(`Redis DEL: ${fullKey} - Deleted: ${result}`);
      return result;
    } catch (err) {
      logger.error(`Redis DEL Error: ${key}`, { error: (err as Error).message });
      return 0;
    }
  }
  
  public async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.isReady) return false;
    try {
      const fullKey = this.getKey(key, prefix);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (err) {
      logger.error(`Redis EXISTS Error: ${key}`, { error: (err as Error).message });
      return false;
    }
  }

  public async expire(key: string, ttlInSeconds: number, prefix?: string): Promise<boolean> {
    if (!this.isReady) return false;
    try {
      const fullKey = this.getKey(key, prefix);
      const result = await this.client.expire(fullKey, ttlInSeconds);
      logger.debug(`Redis EXPIRE: ${fullKey}, TTL: ${ttlInSeconds}s - Result: ${result}`);
      return result;
    } catch (err) {
      logger.error(`Redis EXPIRE Error: ${key}`, { error: (err as Error).message });
      return false;
    }
  }

  public async increment(key: string, incrementBy: number = 1, prefix?: string): Promise<number | null> {
    if (!this.isReady) return null;
    try {
      const fullKey = this.getKey(key, prefix);
      const result = await this.client.incrBy(fullKey, incrementBy);
      logger.debug(`Redis INCRBY: ${fullKey} by ${incrementBy} - New value: ${result}`);
      return result;
    } catch (err) {
      logger.error(`Redis INCRBY Error: ${key}`, { error: (err as Error).message });
      return null;
    }
  }

  public async decrement(key: string, decrementBy: number = 1, prefix?: string): Promise<number | null> {
    if (!this.isReady) return null;
    try {
      const fullKey = this.getKey(key, prefix);
      const result = await this.client.decrBy(fullKey, decrementBy);
      logger.debug(`Redis DECRBY: ${fullKey} by ${decrementBy} - New value: ${result}`);
      return result;
    } catch (err) {
      logger.error(`Redis DECRBY Error: ${key}`, { error: (err as Error).message });
      return null;
    }
  }

  // --- Application Specific Methods ---

  public async blacklistToken(token: string, expiryTimeInSeconds: number): Promise<boolean> {
    return this.set(token, '1', { prefix: this.prefixes.blacklist, ttl: expiryTimeInSeconds });
  }

  public async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.get(token, this.prefixes.blacklist);
    return result === '1';
  }
  
  public async setCache(key: string, data: any, ttlInSeconds: number = this.defaultTTL): Promise<boolean> {
    return this.set(key, data, { prefix: this.prefixes.cache, ttl: ttlInSeconds });
  }

  public async getCache<T>(key: string): Promise<T | null> {
    return this.getObject<T>(key, this.prefixes.cache);
  }

  public async invalidateCache(key: string): Promise<number> {
    return this.delete(key, this.prefixes.cache);
  }

  public async invalidateCachePattern(pattern: string): Promise<number> {
    if (!this.isReady) return 0;
    const fullPattern = this.getKey(pattern, this.prefixes.cache);
    let cursor = 0;
    let deletedCount = 0;
    try {
      do {
        const reply = await this.client.scan(cursor, { MATCH: fullPattern, COUNT: 100 });
        cursor = reply.cursor;
        if (reply.keys.length > 0) {
          deletedCount += await this.client.del(reply.keys);
        }
      } while (cursor !== 0);
      logger.info(`Redis: Invalidated ${deletedCount} keys for pattern ${fullPattern}`);
      return deletedCount;
    } catch (err) {
      logger.error(`Redis: Error invalidating cache pattern ${fullPattern}`, { error: (err as Error).message });
      return deletedCount; // Return count of keys deleted so far
    }
  }
  
  public async flushAllCache(): Promise<string | null> {
    // Be very careful with FLUSHDB or FLUSHALL in production
    // This example flushes only keys matching the cache prefix, which is safer
    // For a true FLUSHDB, you would use: return this.client.flushDb();
    // For now, let's use pattern deletion for all cache keys
    logger.warn(`Redis: Flushing all keys with prefix ${this.prefixes.cache}`);
    const deletedCount = await this.invalidateCachePattern('*'); // '*' within the cache prefix
    return `Flushed ${deletedCount} cache keys.`;
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}

// Export a singleton instance
export const redis = new RedisService();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Redis: Reçu signal ${signal}, fermeture de la connexion Redis.`);
  await redis.disconnect();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
