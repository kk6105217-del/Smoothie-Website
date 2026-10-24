import sys
import os
import argparse
import asyncio

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User

async def init_owner(name: str = "Karthik", email: str = "karthik.suroju@gmail.com", password: str = "OwnerAdmin@2026!", phone: str = "+918555997052"):
    await init_db()
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == email.lower()))
        existing = res.scalars().first()
        
        if existing:
            print(f"[*] User '{email}' already exists. Updating to OWNER role...")
            existing.name = name
            existing.role = "OWNER"
            existing.phone = phone
            existing.password_hash = hash_password(password)
            existing.is_active = True
            await db.commit()
            print(f"[OK] Owner account updated successfully: {email}")
            return existing

        owner = User(
            name=name,
            email=email.lower(),
            phone=phone,
            password_hash=hash_password(password),
            role="OWNER",
            is_active=True
        )
        db.add(owner)
        await db.commit()
        await db.refresh(owner)
        print(f"[OK] Designated OWNER account initialized successfully for VK Technology:")
        print(f"    Name: {owner.name}")
        print(f"    Email: {owner.email}")
        print(f"    Phone: {owner.phone}")
        print(f"    Role: {owner.role}")
        print(f"    ID: {owner.id}")
        return owner

def main():
    parser = argparse.ArgumentParser(description="Initialize protected OWNER account for VK Technology – DIY Tech Projects.")
    parser.add_argument("--name", default="Karthik", help="Owner full name")
    parser.add_argument("--email", default="karthik.suroju@gmail.com", help="Owner email address")
    parser.add_argument("--password", default="OwnerAdmin@2026!", help="Owner secure password")
    parser.add_argument("--phone", default="+918555997052", help="Owner phone number")

    args = parser.parse_args()
    asyncio.run(init_owner(args.name, args.email, args.password, args.phone))

if __name__ == "__main__":
    main()
