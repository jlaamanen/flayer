# Define base image for all stages
ARG BASE_IMAGE
FROM $BASE_IMAGE AS base

##
# Build stage
##
FROM base AS build

# All files need to be copied right away for the preinstall & postinstall scripts to work
WORKDIR /app
COPY client ./client
COPY server ./server

# Build server
WORKDIR /app/server
RUN npm ci && npm run build

# Install client's dependencies
WORKDIR /app/client
RUN npm ci

# Link Flayer in the server package after installing all dependencies
WORKDIR /app/server-pkg
RUN npm link flayer

# Go back to client to build the final bundle
WORKDIR /app/client
RUN npm run build

##
# Runnable server stage
##
FROM base AS run

# Install curl for healthcheck
RUN apk update && apk add curl

WORKDIR /app

COPY --from=build /app/server ./
COPY --from=build /app/client/dist ./static/

# Link the runtime Flayer here to resolve the symlink correctly
RUN npm link flayer

CMD ["npm", "start"]
