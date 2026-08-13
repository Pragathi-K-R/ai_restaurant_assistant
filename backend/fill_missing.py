import os
import random
import shutil
import re
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

def main():
    session = SessionLocal()
    menus = session.query(Menu).all()
    
    # Get all successfully downloaded images
    downloaded_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith('.jpg') and os.path.getsize(os.path.join(IMAGES_DIR, f)) > 1000]
    
    if not downloaded_files:
        print("No downloaded images found to use as fallbacks!")
        return
        
    for menu in menus:
        slug = slugify(menu.name)
        filename = f"{slug}.jpg"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        # If image does not exist or is empty
        if not os.path.exists(filepath) or os.path.getsize(filepath) <= 1000:
            print(f"[{menu.id}] Filling missing image for {menu.name}")
            # Pick a random downloaded image
            src_file = os.path.join(IMAGES_DIR, random.choice(downloaded_files))
            shutil.copy(src_file, filepath)
            menu.image_url = f"/images/menu/{filename}"
            session.add(menu)
        elif not menu.image_url:
            # Update url if not set
            menu.image_url = f"/images/menu/{filename}"
            session.add(menu)
            
    session.commit()
    session.close()
    print("Done filling missing images.")

if __name__ == "__main__":
    main()
