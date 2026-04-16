# Base image lightweight rakhenge
FROM node:20-alpine

# Sab languages aur compilers install karenge
RUN apk add --no-cache \
    python3 \
    py3-pip \
    g++ \
    gcc \
    php \
    bash

# Default working directory
WORKDIR /workspace

# Container start hote hi shell khule
CMD ["sh"]