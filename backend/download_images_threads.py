import os
import re
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.all_models import Menu

IMAGES_DIR = r"c:\Users\HARSHA B\Downloads\ai_restaurant_assistant-main\ai_restaurant_assistant-main\frontend\public\images\menu"
DATABASE_URL = "sqlite:///./restaurant_db.sqlite"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def slugify(text):
    text = text.lower()
    return re.sub(r'[\W_]+', '-', text).strip('-')

def download_image(url, filepath):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        res = urllib.request.urlopen(req, timeout=15)
        with open(filepath, 'wb') as f:
            f.write(res.read())
        return True
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason} - {url}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    return False

def process_menu(menu_id, menu_name):
    slug = slugify(menu_name)
    filename = f"{slug}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        return (menu_id, f"/images/menu/{filename}")
        
    parts = menu_name.split()
    keyword = parts[-1] if parts else "food"
    
    # Use foodish api random as fallback if it's too slow
    url = f"https://loremflickr.com/400/300/{keyword},food/all"
    
    print(f"[{menu_id}] Downloading: {menu_name} from {url}")
    if download_image(url, filepath):
        print(f"[{menu_id}] Success: {menu_name}")
        return (menu_id, f"/images/menu/{filename}")
    else:
        print(f"[{menu_id}] Failed: {menu_name}")
        return (menu_id, None)

def main():
    session = SessionLocal()
    menus = session.query(Menu).all()
    
    menu_data = [(m.id, m.name) for m in menus]
    
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(process_menu, m_id, m_name) for m_id, m_name in menu_data]
        for future in futures:
            results.append(future.result())
            
    # Update db
    for m_id, img_url in results:
        if img_url:
            menu = session.query(Menu).get(m_id)
            if menu:
                menu.image_url = img_url
    
    session.commit()
    session.close()
    print("Done.")

if __name__ == "__main__":
    main()
