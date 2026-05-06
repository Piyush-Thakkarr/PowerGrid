"""ML model + response cache.

Works in-memory by default. Set REDIS_URL env var to switch to Redis
for multi-worker/multi-pod deployments.

Models cached 1 hour, responses cached 15 minutes.
"""

import os
import time
import hashlib
import json
import pickle
import logging
from typing import Any

logger = logging.getLogger(__name__)

MODEL_TTL = 3600
RESPONSE_TTL = 900

_redis = None
_model_cache: dict[str, tuple[Any, float]] = {}
_response_cache: dict[str, tuple[Any, float]] = {}
_key_to_user: dict[str, str] = {}


def _get_redis():
    global _redis
    if _redis is not None:
        return _redis
    redis_url = os.environ.get("REDIS_URL")
    if not redis_url:
        return None
    try:
        import redis
        _redis = redis.from_url(redis_url)
        _redis.ping()
        logger.info("Redis cache connected")
        return _redis
    except Exception as e:
        logger.warning("Redis unavailable, falling back to in-memory: %s", e)
        return None


def _cache_key(prefix: str, user_id, **kwargs) -> str:
    raw = f"{prefix}:{user_id}:{json.dumps(kwargs, sort_keys=True)}"
    key = hashlib.md5(raw.encode()).hexdigest()
    _key_to_user[key] = str(user_id)
    return key


def get_cached_model(user_id, model_name: str):
    key = _cache_key("model", user_id, model=model_name)
    r = _get_redis()
    if r:
        data = r.get(f"pg:model:{key}")
        if data:
            return pickle.loads(data)
        return None

    if key in _model_cache:
        model, ts = _model_cache[key]
        if time.time() - ts < MODEL_TTL:
            return model
        del _model_cache[key]
    return None


def set_cached_model(user_id, model_name: str, model):
    key = _cache_key("model", user_id, model=model_name)
    r = _get_redis()
    if r:
        r.setex(f"pg:model:{key}", MODEL_TTL, pickle.dumps(model))
        r.setex(f"pg:owner:pg:model:{key}", MODEL_TTL, str(user_id))
        return

    _model_cache[key] = (model, time.time())


def get_cached_response(user_id, endpoint: str, **params):
    key = _cache_key("resp", user_id, endpoint=endpoint, **params)
    r = _get_redis()
    if r:
        data = r.get(f"pg:resp:{key}")
        if data:
            return json.loads(data)
        return None

    if key in _response_cache:
        resp, ts = _response_cache[key]
        if time.time() - ts < RESPONSE_TTL:
            return resp
        del _response_cache[key]
    return None


def set_cached_response(user_id, endpoint: str, response, **params):
    key = _cache_key("resp", user_id, endpoint=endpoint, **params)
    r = _get_redis()
    if r:
        r.setex(f"pg:resp:{key}", RESPONSE_TTL, json.dumps(response))
        r.setex(f"pg:owner:pg:resp:{key}", RESPONSE_TTL, str(user_id))
        return

    _response_cache[key] = (response, time.time())


def clear_user_cache(user_id):
    uid = str(user_id)
    r = _get_redis()
    if r:
        for prefix in ["pg:model", "pg:resp"]:
            for key in r.scan_iter(f"{prefix}:*"):
                tag = r.get(f"pg:owner:{key}")
                if tag and tag.decode() == uid:
                    r.delete(key)
                    r.delete(f"pg:owner:{key}")
        return

    for cache in [_model_cache, _response_cache]:
        to_delete = [k for k in cache if _key_to_user.get(k) == uid]
        for k in to_delete:
            del cache[k]
            _key_to_user.pop(k, None)


def cache_stats() -> dict:
    r = _get_redis()
    if r:
        model_keys = list(r.scan_iter("pg:model:*"))
        resp_keys = list(r.scan_iter("pg:resp:*"))
        return {"backend": "redis", "cachedModels": len(model_keys), "cachedResponses": len(resp_keys)}

    now = time.time()
    return {
        "backend": "memory",
        "cachedModels": sum(1 for _, (__, ts) in _model_cache.items() if now - ts < MODEL_TTL),
        "cachedResponses": sum(1 for _, (__, ts) in _response_cache.items() if now - ts < RESPONSE_TTL),
    }
