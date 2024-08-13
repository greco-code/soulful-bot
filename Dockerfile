# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Install PM2 globally
RUN yarn global add pm2

# Copy the rest of the application code
COPY . .

# Copy the wait-for-it.sh script
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh

# Set permissions for wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Build the TypeScript code
RUN yarn build

# Set environment variables
ENV NODE_ENV production

# Expose the port the app runs on
EXPOSE 3000

# Start the bot using wait-for-it to ensure the database is ready
CMD ["pm2-runtime", "ecosystem.config.js"]
