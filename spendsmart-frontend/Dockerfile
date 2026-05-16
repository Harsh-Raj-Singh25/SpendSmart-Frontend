# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage (using simple static file server for now as Nginx was rejected)
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/spendsmart-frontend/browser .
EXPOSE 4200
ENTRYPOINT ["serve", "-s", ".", "-l", "0.0.0.0:4200"]
