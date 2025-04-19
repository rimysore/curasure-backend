# Use official Node.js LTS image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose backend port
EXPOSE 5002

# Start your server
CMD ["node", "server.js"]
