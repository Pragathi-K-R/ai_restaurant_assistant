import asyncio
from app.core.database import AsyncSessionLocal
from app.schemas.user import UserCreate
from app.services.auth_service import AuthService

async def seed_admin():
    print("Seeding admin user...")
    async with AsyncSessionLocal() as db:
        service = AuthService(db)
        # Check if admin already exists
        from app.models.user import User
        from sqlalchemy import select
        
        result = await db.execute(select(User).where(User.email == "admin@restaurant.com"))
        user = result.scalar_one_or_none()
        
        if user:
            print("Admin user already exists!")
            return
            
        admin_data = UserCreate(
            full_name="System Admin",
            email="admin@restaurant.com",
            password="Admin@123",
            phone="1234567890",
            role="admin"
        )
        try:
            await service.register(admin_data)
            print("Successfully created admin@restaurant.com user!")
        except Exception as e:
            print(f"Error creating admin: {e}")

if __name__ == "__main__":
    asyncio.run(seed_admin())
