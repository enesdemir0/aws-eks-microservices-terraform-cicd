FROM python:3.11-slim

# 1. Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy and Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy the rest of the code
COPY . .

# 4. Environment settings
ENV TF_CPP_MIN_LOG_LEVEL=3 \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

CMD ["python", "main.py"]