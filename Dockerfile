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
    bash \
    git \
    openssh-client

USER node

# Container start hote hi shell khule
CMD ["bash"]


# start and build commands
# docker-compose up --build

# run in background
# docker-compose up -d