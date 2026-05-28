# Base image lightweight rakhenge
FROM node:20-alpine

WORKDIR /home/node
RUN chown -R node:node /home/node

# Sab languages aur compilers install karenge
RUN apk add --no-cache \
    python3 \
    py3-pip \
    g++ \
    gcc \
    php \
    php-cli \
    php-mbstring \
    php-xml \
    php-openssl \
    php-json \
    php-phar \
    php-dom \
    php-curl \
    composer \
    php \
    bash \
    git \
    curl \
    openssh-client

USER node

# Container start hote hi shell khule
CMD ["bash"]


# start and build commands
# docker-compose up --build

# run in background
# docker-compose up -d