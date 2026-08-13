import asyncio
import os
import aiohttp
import re
from duckduckgo_search import DDGS
from app.core.database import AsyncSessionLocal
from app.models.all_models import Menu
from sqlalchemy import select

IMAGES_DIR = r"c:\Users\HARSHA B\Downloads\ai_restaurant_assistant-main\ai_restaurant_assistant-main\frontend\public\images\menu"

def slugify(text):
    text = text.lower()
    return re.sub(r'[\W_]+', '-', text).strip('-')

async def download_image(session, url, filepath):
    try:
        # Some servers block python user agent, so use a browser UA
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        async with session.get(url, headers=headers, timeout=10) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    return False

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Menu))
        menus = result.scalars().all()
        
        ddgs = DDGS()
        
        async with aiohttp.ClientSession() as http_session:
            for menu in menus:
                slug = slugify(menu.name)
                filename = f"{slug}.jpg"
                filepath = os.path.join(IMAGES_DIR, filename)
                
                # Check if image already exists
                if os.path.exists(filepath):
                    print(f"[{menu.id}] {menu.name} image already exists.")
                    menu.image_url = f"/images/menu/{filename}"
                    continue
                
                print(f"[{menu.id}] Searching image for: {menu.name}")
                query = f"{menu.name} food high resolution photo"
                try:
                    results = list(ddgs.images(query, max_results=3, safesearch="off"))
                    success = False
                    for res in results:
                        img_url = res.get('image')
                        if img_url:
                            print(f"  -> Trying URL: {img_url}")
                            if await download_image(http_session, img_url, filepath):
                                menu.image_url = f"/images/menu/{filename}"
                                success = True
                                print(f"  -> Success!")
                                break
                    if not success:
                        print(f"  -> Could not download any image for {menu.name}")
                except Exception as e:
                    print(f"Error searching for {menu.name}: {e}")
                
                await asyncio.sleep(1)
                
        await db.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
