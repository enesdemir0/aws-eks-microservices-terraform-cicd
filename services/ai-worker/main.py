import os
import json
import time
import logging
import tempfile
from pathlib import Path

import tensorflow as tf
import redis
from src.config.settings import settings
import httpx

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


def preprocess_image(image_path: str):
    raw = tf.io.read_file(image_path)
    img = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, (299, 299))
    img = tf.keras.applications.xception.preprocess_input(img)
    return tf.expand_dims(img, 0)


def fetch_image(raw_path: str) -> tuple[str, bool]:
    """Returns (local_path, should_delete_after).

    Local mode  → resolve /app/uploads/{filename}, no cleanup needed.
    S3 mode     → download to a temp file, caller must delete after inference.
    """
    if settings.STORAGE_TYPE == "s3":
        import boto3
        s3 = boto3.client("s3", region_name=settings.AWS_REGION)
        suffix = Path(raw_path).suffix or ".jpg"
        tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        try:
            s3.download_fileobj(settings.AWS_S3_BUCKET, raw_path, tmp)
        finally:
            tmp.close()
        return tmp.name, True

    filename = os.path.basename(raw_path)
    return f"/app/uploads/{filename}", False


def run_worker():
    tokenizer_path = os.path.join(settings.MODEL_DIR, "tokenizer.json")
    with open(tokenizer_path, "r", encoding="utf-8") as f:
        tok = json.load(f)
    index_word = {int(k): v for k, v in tok["index_word"].items()}
    captioner = tf.saved_model.load(settings.MODEL_DIR)

    r = redis.from_url(settings.REDIS_URL, decode_responses=True)
    metadata_url = settings.METADATA_API_URL

    logger.info("AI Worker ready (storage=%s)", settings.STORAGE_TYPE)

    while True:
        try:
            result = r.blpop(settings.TASK_QUEUE, timeout=10)
            if not result:
                continue

            _, task_json = result
            task = json.loads(task_json)
            task_id = task.get("task_id")
            user_id = task.get("user_id")
            raw_path = task.get("image_path")

            local_path, cleanup = fetch_image(raw_path)
            try:
                img_tensor = preprocess_image(local_path)
                token_ids = captioner.predict(img_tensor).numpy()
            finally:
                if cleanup:
                    os.unlink(local_path)

            words = []
            for tid in token_ids:
                word = index_word.get(int(tid), "<unk>")
                if word == "<end>":
                    break
                if word not in ("<start>", "<pad>", "<unk>"):
                    words.append(word)

            final_caption = " ".join(words)
            logger.info("Caption: %s", final_caption)

            payload = {
                "task_id": task_id,
                "user_id": int(user_id),
                "image_path": raw_path,
                "caption": final_caption,
            }

            with httpx.Client() as client:
                resp = client.post(metadata_url, json=payload)
                if resp.status_code in (200, 201):
                    logger.info("Metadata saved for task %s", task_id)
                else:
                    logger.error("Failed to save metadata: %s", resp.text)

        except Exception as e:
            logger.error("Worker error: %s", e)
            time.sleep(2)


if __name__ == "__main__":
    run_worker()
