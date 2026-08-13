import asyncio
import os
import aiohttp
import re
import urllib.parse
from app.core.database import AsyncSessionLocal
from app.models.all_models import Menu
from sqlalchemy import select

IMAGES_DIR = r"c:\Users\HARSHA B\Downloads\ai_restaurant_assistant-main\ai_restaurant_assistant-main\frontend\public\images\menu"

def slugify(text):
    text = text.lower()
    return re.sub(r'[\W_]+', '-', text).strip('-')

async def fetch_wiki_image_url(session, query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch={encoded_query}&gsrlimit=1&pithumbsize=800"
    
    headers = {'User-Agent': 'RestaurantAIDemo/1.0 (test@example.com)'}
    try:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                pages = data.get('query', {}).get('pages', {})
                for page_id, page_info in pages.items():
                    thumb = page_info.get('thumbnail')
                    if thumb and 'source' in thumb:
                        return thumb['source']
    except Exception as e:
        print(f"Error fetching wiki for {query}: {e}")
    return None

def download_image_sync(url, filepath):
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=10)
        with open(filepath, 'wb') as f:
            f.write(res.read())
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

async def download_image(session, url, filepath):
    return await asyncio.to_thread(download_image_sync, url, filepath)

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Menu))
        menus = result.scalars().all()
        
        async with aiohttp.ClientSession() as http_session:
            generic_url = await fetch_wiki_image_url(http_session, "gourmet meal plate")
            
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
                img_url = await fetch_wiki_image_url(http_session, menu.name)
                
                # If specific food not found, try a simpler query (last word)
                if not img_url:
                    parts = menu.name.split()
                    if len(parts) > 1:
                        img_url = await fetch_wiki_image_url(http_session, parts[-1])
                
                # Ultimate fallback
                if not img_url:
                    img_url = generic_url
                    
                if img_url:
                    print(f"  -> Downloading URL: {img_url}")
                    if await download_image(http_session, img_url, filepath):
                        menu.image_url = f"/images/menu/{filename}"
                        print(f"  -> Success!")
                    else:
                        print(f"  -> Download failed")
                else:
                    print(f"  -> No image URL found at all!")
                
                await asyncio.sleep(0.5)
                
        await db.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
