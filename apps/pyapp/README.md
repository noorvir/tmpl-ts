# PyApp

A FastAPI server with Marimo notebooks, managed by UV.

## Prerequisites

- [UV](https://docs.astral.sh/uv/) - Fast Python package manager

## Getting Started

### Install dependencies

```bash
uv sync
```

### Run the FastAPI server

```bash
uv run python server.py
# or
uv run uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at http://localhost:8000

### API Endpoints

- `GET /` - Hello message
- `GET /health` - Health check
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

## Marimo Notebooks

### Open the Marimo editor

```bash
uv run marimo edit
```

### Edit a specific notebook

```bash
uv run marimo edit notebooks/example.py
```

### Create a new notebook

```bash
uv run marimo new
```

## Project Structure

```
pyapp/
├── server.py          # FastAPI server
├── notebooks/         # Marimo notebooks
│   └── example.py     # Example notebook
├── pyproject.toml     # Project configuration
└── uv.lock           # Lockfile
```

