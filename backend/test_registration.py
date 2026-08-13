import asyncio
import os
import sys

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///restaurant_db_test.sqlite"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///restaurant_db_test.sqlite"
os.environ["SECRET_KEY"] = "testsecretkey"

from app.core.database import create_tables
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.core.database import AsyncSessionLocal

async def test_registration():
    await create_tables()
    async with AsyncSessionLocal() as db:
        service = AuthService(db)
        user_data = UserCreate(
            full_name="Test User",
            email="testuser@example.com",
            phone="9876543210",
            role=UserRole.STAFF,
            password="TestPassword123!"
        )
        try:
            user = await service.register(user_data)
            print("REGISTRATION SUCCESS:")
            print(user.model_dump())
            await db.commit()
        except Exception as e:
            print(f"REGISTRATION FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_registration())
