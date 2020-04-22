FROM node:14
ARG API_KEY
ENV API_KEY=$API_KEY
COPY . .
RUN ["npm", "install"]
CMD ["npm", "test"]
