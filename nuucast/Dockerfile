FROM rust:1.97 AS builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY templates ./templates
COPY static ./static
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    cargo build --release && \
    cp /app/target/release/nuucast /tmp/nuucast

RUN mkdir -p /app/target/release && \
    mv /tmp/nuucast /app/target/release/nuucast

RUN rm src/*.rs

FROM debian:trixie-slim AS runtime

RUN apt-get update && apt-get install -y \
  ca-certificates ffmpeg mkvtoolnix \
  && ffmpeg -version \
  && mkvmerge --version

RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/nuucast /app/nuucast
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static
RUN mkdir -p /app/temp_files && chmod 777 /app/temp_files

ENV PROJECT_ROOT=/app/

EXPOSE 3000
CMD ["/app/nuucast"]
