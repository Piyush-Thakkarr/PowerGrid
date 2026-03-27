#!/bin/bash
set -e

pip install -r requirements-prod.txt
python -m alembic upgrade head
