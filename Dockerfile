# Stage 1: Building the code
FROM node:23.7.0 as builder

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./
COPY pnpm*.yaml ./

# Install pre-install deps
RUN npm install --global pnpm@9.9.0
RUN pnpm install

# Copy the code
COPY . /app

# Set our env vars needed for building it for /blog
ENV NEXT_PUBLIC_BASE_URL='/blog'
ENV NEXT_PUBLIC_MODE='production'

RUN cd packages/blog-starter-kit/themes/enterprise && \
    pnpm install

RUN cd packages/blog-starter-kit/themes/enterprise && \
    pnpm run build

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "-c", "cd /app/packages/blog-starter-kit/themes/enterprise && /usr/local/bin/pnpm run start" ]
# # RUN pnpm dev
