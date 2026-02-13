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
COPY --from=builder /app/target/release/nuucast /app/nuucast

ENV PROJECT_ROOT=/app/

EXPOSE 3000
CMD ["/app/nuucast"]