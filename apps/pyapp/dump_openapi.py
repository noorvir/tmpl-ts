#!/usr/bin/env python3
"""Dump FastAPI OpenAPI spec to openapi.json (for CI/scripts)"""
import json
from pathlib import Path

from server import app


def main():
    spec_path = Path(__file__).parent / "openapi.json"
    with open(spec_path, "w") as f:
        json.dump(app.openapi(), f, indent=2)
    print(f"OpenAPI spec written to {spec_path}")


if __name__ == "__main__":
    main()

