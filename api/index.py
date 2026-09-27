"""Vercel Serverless Function entry - wraps FastAPI app with Mangum"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

# Ensure MOCK_MODE for Vercel deployment (no API keys needed)
os.environ.setdefault("MOCK_MODE", "true")

from mangum import Mangum
from app.main import app

handler = Mangum(app)
