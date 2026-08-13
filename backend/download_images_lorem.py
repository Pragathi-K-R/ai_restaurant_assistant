import asyncio
import os
import aiohttp
import re
from app.core.database import AsyncSessionLocal
from app.models.all_models import Menu
from sqlalchemy import select

IMAGES_DIR = r"c:\Users\HARSHA B\Downloads\ai_restaurant_assistant-main\ai_restaurant_assistant-main\frontend\public\images\menu"

def slugify(text):
    text = text.lower()
    return re.sub(r'[\W_]+', '-', text).strip('-')

async def download_image(session, url, filepath):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        async with session.get(url, headers=headers, timeout=20) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    return False

async def process_menu(sem, session, menu):
    async with sem:
        slug = slugify(menu.name)
        filename = f"{slug}.jpg"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            menu.image_url = f"/images/menu/{filename}"
            return
            
        # Get last word as keyword
        parts = menu.name.split()
        keyword = parts[-1] if parts else "food"
        # Combine with "food" to ensure it's food related
        url = f"https://loremflickr.com/400/300/{keyword},food/all"
        
        print(f"[{menu.id}] Downloading: {menu.name} from {url}")
        if await download_image(session, url, filepath):
            menu.image_url = f"/images/menu/{filename}"
            print(f"[{menu.id}] Success: {menu.name}")
        else:
            print(f"[{menu.id}] Failed: {menu.name}")

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Menu))
        menus = result.scalars().all()
        
        sem = asyncio.Semaphore(15)
        async with aiohttp.ClientSession() as http_session:
            tasks = [process_menu(sem, http_session, menu) for menu in menus]
            await asyncio.gather(*tasks)
            
        await db.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
