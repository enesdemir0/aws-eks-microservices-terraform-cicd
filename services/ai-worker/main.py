import os
import json
import time
import logging
import tensorflow as tf
import redis
from src.config.settings import settings
import httpx 

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def preprocess_image(image_path):
    raw = tf.io.read_file(image_path)
    img = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, (299, 299))
    img = tf.keras.applications.xception.preprocess_input(img)
    return tf.expand_dims(img, 0)

def run_worker():
    # 1. Load Tokenizer & Model (Same as before)
    tokenizer_path = os.path.join(settings.MODEL_DIR, "tokenizer.json")
    with open(tokenizer_path, "r", encoding="utf-8") as f:
        tok = json.load(f)
    index_word = {int(k): v for k, v in tok["index_word"].items()}
    captioner = tf.saved_model.load(settings.MODEL_DIR)
    
    # 2. Connect to Redis
    r = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # URL for the Metadata API (from settings/env)
    # Inside Docker, this should be http://metadata-app:8001/api/metadata/save
    metadata_url = os.getenv("METADATA_API_URL", "http://metadata-app:8001/api/metadata/save")

    logger.info("🤖 AI Worker is fully connected and ready!")

    while True:
        try:
            result = r.blpop(settings.TASK_QUEUE, timeout=10)
            if not result: continue

            _, task_json = result
            task = json.loads(task_json)
            task_id = task.get("task_id")
            user_id = task.get("user_id") # We need this for the DB!
            raw_path = task.get("image_path")
            
            filename = os.path.basename(raw_path)
            image_full_path = f"/app/uploads/{filename}"

            # 3. Run AI Inference
            img_tensor = preprocess_image(image_full_path)
            token_ids = captioner.predict(img_tensor).numpy()

            words = []
            for tid in token_ids:
                word = index_word.get(int(tid), "<unk>")
                if word == "<end>": break
                if word not in ("<start>", "<pad>", "<unk>"):
                    words.append(word)
            
            final_caption = " ".join(words)
            logger.info(f"✨ RESULT: {final_caption}")

            # 4. SEND TO LIBRARIAN (Metadata API)
            payload = {
                "task_id": task_id,
                "user_id": int(user_id),
                "image_path": image_full_path,
                "caption": final_caption
            }
            
            # Using sync httpx for the simple worker loop
            with httpx.Client() as client:
                resp = client.post(metadata_url, json=payload)
                if resp.status_code == 200 or resp.status_code == 201:
                    logger.info(f"💾 Metadata saved for task {task_id}")
                else:
                    logger.error(f"❌ Failed to save metadata: {resp.text}")
                
        except Exception as e:
            logger.error(f"💥 Worker Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_worker()