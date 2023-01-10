# Define base image for all stages
ARG BASE_IMAGE
FROM $BASE_IMAGE AS base

# Client build stage
FROM base AS client-build

WORKDIR /app/client

COPY client/package*.json .
RUN npm ci

# Copy & npm link the server package after installing all dependencies
WORKDIR /app/server-pkg

COPY server-pkg .
RUN npm link flayer

# Back to client
WORKDIR /app/client

COPY client .
RUN npm run build

# Server build stage
FROM base AS server-build

WORKDIR /app/server

COPY server/package*.json .
RUN npm ci

COPY server .
RUN npm run build

# Final server image
FROM base AS run

# Install curl for healthcheck
RUN apk update && apk add curl

WORKDIR /app

COPY --from=server-build /app/server ./
COPY --from=client-build /app/client/dist ./static/

# Link the runtime Flayer here to resolve the symlink correctly
RUN npm link flayer

CMD ["npm", "start"]
