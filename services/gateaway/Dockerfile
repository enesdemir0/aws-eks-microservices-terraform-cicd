# 1. Use a lightweight Python image
FROM python:3.11-slim

# 2. Set environment variables
# Prevents Python from writing .pyc files and ensures logs are sent straight to terminal
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# 3. Install system dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the source code
COPY src/ ./src/

# 6. Create the uploads directory and set permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# 7. Expose the port
EXPOSE 8000

# 8. Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]