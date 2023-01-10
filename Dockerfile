# Base image for E2E tests
# --------------
# Contains the current version of Flayer built & npm linked


FROM node:18.10-alpine

WORKDIR /flayer

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

RUN npm link
