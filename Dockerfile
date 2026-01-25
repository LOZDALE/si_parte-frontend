FROM php:8.2-alpine

RUN apk add --no-cache gettext

WORKDIR /app
COPY . /app

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "envsubst < /app/config.template.js > /app/config.js && php -S 0.0.0.0:${PORT} -t /app"]
