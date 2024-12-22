FROM node

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json .

# Install dependencies
RUN npm ci

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm-dev \
    libgtk-3-0 \
    libpango-1.0-0 \
    libcups2 \
    libdrm2 \
    libasound2 \
    fonts-liberation \
    libatk1.0-0 \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to download its Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=false

# Copy the rest of the application
COPY . .

# Command to start the server
CMD ["npm", "run", "dev"]
