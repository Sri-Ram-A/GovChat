# ---------- Build stage ----------
FROM python:3.11-slim AS builder

# Python packages (grpc, torch, numpy, etc.) compile C/C++ extensions.
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------- Runtime stage ----------
FROM python:3.11-slim

ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY server.py retrieve.py ttt_pb2.py ttt_pb2_grpc.py ./
COPY processed_data/ processed_data/

EXPOSE 50054

HEALTHCHECK CMD python -c "import grpc; grpc.insecure_channel('localhost:50054').close()"

CMD ["python", "server.py"]
