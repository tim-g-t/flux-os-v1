# Base image
FROM node:20-alpine

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port 8050
EXPOSE 8050

# Start your app (be sure your app listens on port 8050)
CMD ["npm", "start"]
