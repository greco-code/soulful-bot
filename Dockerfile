# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies, omitting devDependencies
ENV NODE_ENV=production
RUN yarn install

# Copy the rest of your application code
COPY . .

# Expose the port the app runs on (if needed for health checks)
EXPOSE 3000

# Start the bot
CMD ["yarn", "start"]
