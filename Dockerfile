FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json index.html styles.css ./
COPY vendor ./vendor
COPY scripts ./scripts
COPY server ./server
COPY src ./src
COPY public ./public
RUN node scripts/build.mjs

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=4173
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:4173/healthz || exit 1
CMD ["node", "scripts/serve.mjs"]
