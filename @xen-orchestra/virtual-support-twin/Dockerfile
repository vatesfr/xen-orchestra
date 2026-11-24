# Runtime of Xen Orchestra, which is built on the host and mounted in /opt/xen-orchestra (see README)
#
# Build context: this directory

# same Node.js major and Debian release as the host which built XO, for its native modules
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-bookworm-slim

# libfuse2 is loaded by xo-server at startup
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libfuse2 redis-server \
  && rm -rf /var/lib/apt/lists/*

COPY xo-server.toml /etc/xo-server/config.toml
COPY entrypoint.sh /usr/local/bin/

EXPOSE 80
ENTRYPOINT ["entrypoint.sh"]
