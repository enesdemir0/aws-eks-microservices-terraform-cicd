import os
import json
import time
import logging
import tensorflow as tf
import redis
from src.config.settings import settings

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
    # 1. Load Tokenizer
    tokenizer_path = os.path.join(settings.MODEL_DIR, "tokenizer.json")
    with open(tokenizer_path, "r", encoding="utf-8") as f:
        tok = json.load(f)
    index_word = {int(k): v for k, v in tok["index_word"].items()}

    # 2. Load Model
    logger.info(f"Loading AI Model from {settings.MODEL_DIR}...")
    captioner = tf.saved_model.load(settings.MODEL_DIR)
    logger.info("✅ AI Model loaded and ready!")

    # 3. Connect to Redis
    r = redis.from_url(settings.REDIS_URL, decode_responses=True)
    logger.info(f"Watching queue: {settings.TASK_QUEUE}")

    while True:
        try:
            result = r.blpop(settings.TASK_QUEUE, timeout=10)
            if not result:
                continue

            _, task_json = result
            task = json.loads(task_json)
            task_id = task.get("task_id")
            
            # --- THE FINAL PATH FIX ---
            # 1. Get the path sent by Gateway (e.g., /app/uploads/img.jpg)
            raw_path = task.get("image_path")
            
            # 2. Extract ONLY the filename (e.g., img.jpg)
            filename = os.path.basename(raw_path)
            
            # 3. Target the correct folder inside THIS container
            image_full_path = f"/app/uploads/{filename}"

            logger.info(f"📸 Processing task {task_id}: {image_full_path}")

            # 4. Debug: If file missing, show us what IS in that folder
            if not os.path.exists(image_full_path):
                logger.error(f"❌ File not found at {image_full_path}!")
                if os.path.exists("/app/uploads"):
                    logger.info(f"Directory /app/uploads contains: {os.listdir('/app/uploads')}")
                continue

            # 5. Run Inference
            img_tensor = preprocess_image(image_full_path)
            token_ids = captioner.predict(img_tensor).numpy()

            # 6. Build Caption
            words = []
            for tid in token_ids:
                word = index_word.get(int(tid), "<unk>")
                if word == "<end>": break
                if word not in ("<start>", "<pad>", "<unk>"):
                    words.append(word)
            
            final_caption = " ".join(words)
            logger.info(f"✨ SUCCESS: Task {task_id} caption: {final_caption}")
                
        except Exception as e:
            logger.error(f"💥 Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_worker()