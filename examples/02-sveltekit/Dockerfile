# Define base image for all stages
ARG BASE_IMAGE
FROM $BASE_IMAGE AS base

# Install curl for healthcheck
RUN apk update && apk add curl

WORKDIR /app

COPY package*.json .
RUN npm ci
RUN npm link flayer

# Copy & npm link the server package after installing all dependencies
WORKDIR /app/server-pkg
COPY server-pkg .
RUN npm link flayer

# Build the application
WORKDIR /app
COPY . .
RUN npm run build


CMD ["npm", "run", "preview"]
