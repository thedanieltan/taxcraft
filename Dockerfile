FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app
COPY . .
RUN npm ci \
  && npm run build \
  && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "start"]
