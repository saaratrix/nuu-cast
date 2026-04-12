FROM rust:1.93 AS builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release
RUN rm src/*.rs

FROM debian:trixie-slim AS runtime

RUN apt-get update && apt-get install -y \
  ca-certificates
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/nuuwatch /app/nuuwatch
RUN mkdir -p /app/data && chmod 777 /app/data

ENV NUUWATCH_PROJECT_ROOT=/app/
ENV NUUCAST_URL=http://localhost:3000

EXPOSE 3000
CMD ["/app/nuuwatch"]