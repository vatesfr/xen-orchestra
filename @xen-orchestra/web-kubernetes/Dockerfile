# syntax=docker/dockerfile:1

# Kubernetes UI plugin of XO 6, served as static files by nginx.
#
# The plugin is built from the xen-orchestra monorepo (it uses `@xen-orchestra/web-core` and the XO 6 SDK), so the
# build context is the repository root:
#
#   docker build -f @xen-orchestra/web-kubernetes/Dockerfile -t xo-web-kubernetes .

FROM node:22.23.3-alpine3.23 AS build

WORKDIR /src

# The whole monorepo is needed by Yarn workspaces (see `Dockerfile.dockerignore` for what is left out)
COPY . .

RUN yarn install --frozen-lockfile --ignore-scripts --network-timeout 600000

# The plugin bundles code from `@vates/types`, which is consumed through its build output
RUN cd @vates/types && npx tsc --noCheck

RUN yarn --cwd @xen-orchestra/web-kubernetes build-only

FROM nginxinc/nginx-unprivileged:1.29.3-alpine3.22

COPY @xen-orchestra/web-kubernetes/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/@xen-orchestra/web-kubernetes/dist /usr/share/xo-web-kubernetes

EXPOSE 8080
