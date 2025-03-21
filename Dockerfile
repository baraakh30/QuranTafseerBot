# Use Python 3.9 as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .

RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV FLASK_APP=wsgi.py
ENV FLASK_ENV=production

# Expose the port the app will run on
EXPOSE 5000

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]