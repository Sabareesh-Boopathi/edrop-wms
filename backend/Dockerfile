# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies
# postgresql-client is needed for the psql command in the wait script
RUN apt-get update \
    && apt-get install -y postgresql-client-15 \
    && rm -rf /var/lib/apt/lists/*

# Copy the wait script to a standard binary location and make it executable
COPY docker/backend/wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh
RUN chmod +x /usr/local/bin/wait-for-postgres.sh

# Set the working directory for the application
WORKDIR /usr/src/app

# --- START DEBUGGING ---
# List the contents of the build context to see what Docker can access.
# This will show us if 'docker/backend/wait-for-postgres.sh' is visible.
COPY . /build_context
RUN echo "--- Listing Build Context ---" && ls -laR /build_context
RUN rm -rf /build_context
# --- END DEBUGGING ---

# Copy and install requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the application code (will be overwritten by volume mount in dev)
COPY backend/ .

# --- DEBUGGING STEP 2 ---
# List the contents of the app directory AFTER the copy to confirm success.
RUN ls -la /usr/src/app

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the app using uvicorn
# The host 0.0.0.0 makes the server accessible from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]