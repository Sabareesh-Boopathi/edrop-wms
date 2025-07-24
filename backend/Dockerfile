# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies, including sed for file format conversion
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client sed && rm -rf /var/lib/apt/lists/*

# Copy the wait script to a standard binary location
COPY docker/backend/wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh

# Use sed to remove Windows carriage returns (\r) and then make the script executable.
RUN sed -i 's/\r$//g' /usr/local/bin/wait-for-postgres.sh && \
    chmod +x /usr/local/bin/wait-for-postgres.sh

# Set the working directory for the application
WORKDIR /usr/src/app

# Copy and install requirements first to leverage Docker cache
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the application code
COPY backend/ .

# Expose the port the app runs on
EXPOSE 8000

# The CMD is now defined in docker-compose.yml for better flexibility.