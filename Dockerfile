FROM node:22-alpine

WORKDIR /workspace
COPY package.json package-lock.json .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci
COPY . .
CMD ["npm", "run", "check"]
