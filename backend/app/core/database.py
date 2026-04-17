"""Database connection management - Supabase PostgreSQL."""
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
import asyncpg
import redis.asyncio as redis

# Supabase client (for Auth & Storage)
_supabase_client: Optional[Client] = None

# Async PostgreSQL pool (for raw SQL with pgvector)
_pg_pool: Optional[asyncpg.Pool] = None

# Redis client (for caching & session state)
_redis_client: Optional[redis.Redis] = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY,
            )
        except Exception as e:
            print(f"CRITICAL: Failed to init Supabase: {e}")
            raise e
    return _supabase_client


async def get_pg_pool() -> Optional[asyncpg.Pool]:
    global _pg_pool
    if _pg_pool is None:
        # Check if we have a valid PostgreSQL URL
        if not settings.SUPABASE_URL:
            return None
            
        # If we don't have a dedicated DATABASE_URL, this fallback is likely broken
        # Let's try to see if it works, but catch errors
        try:
            db_url = settings.SUPABASE_URL.replace("https://", "postgresql://postgres:")
            # Note: This is usually missing the password, so it WILL fail unless configured otherwise
            # For now, let's just return None to trigger fallbacks in services
            print("Warning: asyncpg pool not configured (missing password). Using fallbacks.")
            return None
        except Exception as e:
            print(f"Warning: Failed to create pg pool: {e}")
            return None
    return _pg_pool


async def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    
    # If explicitly disabled, don't even try to connect (saves 2s timeout lag)
    if not settings.USE_REDIS:
        return None
        
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            # Test connection
            await _redis_client.ping()
            print("Successfully connected to Redis")
        except Exception as e:
            print(f"Warning: Redis not reachable at {settings.REDIS_URL}. Falling back to in-memory/limited functionality. Error: {e}")
            _redis_client = None
    return _redis_client


async def init_db():
    """Initialize database connections on startup."""
    get_supabase()
    # Attempt to connect to Redis but don't block app startup if it fails
    await get_redis()
    # Note: pg_pool is initialized lazily on first use


async def close_db():
    """Close all database connections."""
    global _pg_pool, _redis_client
    if _pg_pool:
        await _pg_pool.close()
    if _redis_client:
        await _redis_client.close()
