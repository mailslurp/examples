FROM node:14
ARG API_KEY
ENV API_KEY=$API_KEY
COPY . .
RUN ["rm", "-rf", "node_modules"]
RUN ["npm", "install"]
CMD ["npm", "test"]
