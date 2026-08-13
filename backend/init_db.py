"""
Standalone database initialization script.
Run this once to create all database tables in PostgreSQL.
"""
import asyncio
import logging
from app.core.database import create_tables, engine

logging.basicConfig(level=logging.INFO)

async def main():
    print("Initializing database tables...")
    await create_tables()
    print("Database tables created successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
