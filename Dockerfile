# 如果 node:18-alpine 下载失败，可以尝试 node:18
FROM node:18
WORKDIR /app
ENV NODE_ENV production
COPY .next ./.next
COPY public ./public
COPY package.json ./
COPY next.config.js ./ 
RUN npm install --only=production
EXPOSE 3000
CMD ["npm", "start"]