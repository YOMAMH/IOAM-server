FROM node:7.8.0

RUN mkdir -p /Users/renminghe/ty-cmdb
WORKDIR  /Users/renminghe/ty-cmdb

COPY . /Users/renminghe/ty-cmdb
RUN npm install

EXPOSE 3000
CMD ["npm", "start"] 
