# Define base image for all stages
ARG BASE_IMAGE
FROM $BASE_IMAGE AS base

# Install curl for healthcheck
RUN apk update && apk add curl

WORKDIR /app

COPY . .
# Npm link isn't sufficient for the postinstall script - install Flayer locally
RUN npm i /flayer
RUN npm ci && npm link flayer

# Copy & npm link the server package after installing all dependencies
WORKDIR /app/server-pkg
RUN npm ci && npm link flayer

# Build the application
WORKDIR /app
RUN npm run build


CMD ["npm", "run", "preview"]
