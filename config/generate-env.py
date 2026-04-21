#!/usr/bin/env python3
"""
Generate environment variable files from the layered YAML config.

Usage:
  python config/generate-env.py local          # Print .env to stdout
  python config/generate-env.py local --out .env   # Write to file
  python config/generate-env.py eks            # EKS config (secrets from env)

The script deep-merges base.yml with the target environment YAML,
then renders all service env-var blocks.
"""
import argparse
import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


CONFIG_DIR = Path(__file__).parent


def deep_merge(base: dict, override: dict) -> dict:
    result = base.copy()
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(result.get(k), dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result


def load_config(env: str) -> dict:
    base = yaml.safe_load((CONFIG_DIR / "base.yml").read_text())
    env_file = CONFIG_DIR / f"{env}.yml"
    if not env_file.exists():
        print(f"Config file not found: {env_file}", file=sys.stderr)
        sys.exit(1)
    override = yaml.safe_load(env_file.read_text())
    return deep_merge(base, override)


def build_env_vars(cfg: dict) -> dict[str, str]:
    svc = cfg.get("service_urls", {})
    db_user = cfg.get("secrets", {}).get("db_user", "${DB_USER}")
    db_pass = cfg.get("secrets", {}).get("db_password", "${DB_PASSWORD}")
    jwt_secret = cfg.get("secrets", {}).get("jwt_secret", "${JWT_SECRET}")
    db_cfg = cfg.get("databases", {})
    auth_db_host = db_cfg.get("auth_db", {}).get("host", "${AUTH_DB_HOST}")
    meta_db_host = db_cfg.get("metadata_db", {}).get("host", "${METADATA_DB_HOST}")
    redis_url = svc.get("redis", "${REDIS_URL}")
    base_svc = cfg.get("services", {})

    return {
        # Shared
        "DB_USER": db_user,
        "DB_PASSWORD": db_pass,
        "DB_NAME": db_cfg.get("auth_db", {}).get("name", "auth_db"),
        "NODE_ENV": cfg.get("node_env", "production"),
        # Auth service
        "JWT_SECRET": jwt_secret,
        "DATABASE_URL": (
            f"postgresql://{db_user}:{db_pass}"
            f"@{auth_db_host}:{db_cfg.get('auth_db', {}).get('port', 5432)}"
            f"/{db_cfg.get('auth_db', {}).get('name', 'auth_db')}"
        ),
        # Gateway service
        "AUTH_SERVICE_URL": svc.get("auth_service", ""),
        "REDIS_URL": redis_url,
        "REDIS_QUEUE_NAME": base_svc.get("redis", {}).get("queue_name", "image_tasks"),
        "UPLOAD_DIR": base_svc.get("gateway", {}).get("upload_dir", "/app/uploads"),
        "STORAGE_TYPE": cfg.get("gateway", {}).get("storage_type", "local"),
        "MAX_FILE_SIZE_MB": str(base_svc.get("gateway", {}).get("max_file_size_mb", 10)),
        # Metadata API
        "METADATA_DATABASE_URL": (
            f"postgresql://{db_user}:{db_pass}"
            f"@{meta_db_host}:{db_cfg.get('metadata_db', {}).get('port', 5433)}"
            f"/{db_cfg.get('metadata_db', {}).get('name', 'metadata_db')}"
        ),
        # AI worker
        "TASK_QUEUE": base_svc.get("ai_worker", {}).get("task_queue", "image_tasks"),
        "METADATA_API_URL": f"{svc.get('metadata_api', '')}/api/metadata/save",
        # Frontend
        "AUTH_SERVICE_URL_FRONTEND": svc.get("auth_service", ""),
        "GATEWAY_SERVICE_URL_FRONTEND": svc.get("gateway_service", ""),
        "METADATA_API_URL_FRONTEND": svc.get("metadata_api", ""),
    }


def render_dotenv(env_vars: dict[str, str]) -> str:
    lines = ["# Auto-generated — do not edit manually. Re-run: python config/generate-env.py\n"]
    for k, v in sorted(env_vars.items()):
        lines.append(f"{k}={v}")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Generate .env from YAML config")
    parser.add_argument("environment", choices=["local", "eks"], help="Target environment")
    parser.add_argument("--out", help="Write to file instead of stdout")
    args = parser.parse_args()

    cfg = load_config(args.environment)
    env_vars = build_env_vars(cfg)
    output = render_dotenv(env_vars)

    if args.out:
        Path(args.out).write_text(output)
        print(f"Written to {args.out}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
