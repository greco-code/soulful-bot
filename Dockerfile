# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install bash
RUN apk add --no-cache bash

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the wait-for-it script and make it executable
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN yarn build

# Set environment variables
ENV NODE_ENV production

# Expose the port the app runs on
EXPOSE 3000

# Start the bot
CMD ["node", "build/index.js"]
