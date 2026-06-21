FROM python:3.11-slim

WORKDIR /app

# Cache dependencies first (only re-installs when requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Render/Railway injects PORT environment variable automatically
EXPOSE 8080

# Start command
CMD ["python", "main.py"]
