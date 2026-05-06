"""Thin database layer — raw asyncpg connection pool."""

import asyncpg
from app.config import get_settings

_pool = None


async def get_pool():
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)
    return _pool


async def fetch(sql, *args):
    pool = await get_pool()
    return await pool.fetch(sql, *args)


async def fetchrow(sql, *args):
    pool = await get_pool()
    return await pool.fetchrow(sql, *args)


async def fetchval(sql, *args):
    pool = await get_pool()
    return await pool.fetchval(sql, *args)


async def execute(sql, *args):
    pool = await get_pool()
    return await pool.execute(sql, *args)


async def close():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
