FROM rust:1.97 AS builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./nuuwatch/
COPY src ./nuuwatch/src
COPY templates ./nuuwatch/templates
COPY static ./nuuwatch/static

COPY --from=module_anime_other / ./nuuwatch/src/modules/anime/other

COPY --from=nuufetch /Cargo.toml ./nuufetch/Cargo.toml
COPY --from=nuufetch /src ./nuufetch/src

WORKDIR /app/nuuwatch

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/nuuwatch/target \
    cargo build --release && \
    cp /app/nuuwatch/target/release/nuuwatch /tmp/nuuwatch

RUN mkdir -p /app/nuuwatch/target/release && \
    mv /tmp/nuuwatch /app/nuuwatch/target/release/nuuwatch

RUN rm src/*.rs

FROM debian:trixie-slim AS runtime

RUN apt-get update && apt-get install -y \
  ca-certificates
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/nuuwatch/target/release/nuuwatch ./nuuwatch
COPY --from=builder /app/nuuwatch/templates ./templates
COPY --from=builder /app/nuuwatch/static ./static

EXPOSE 3001
CMD ["/app/nuuwatch"]
