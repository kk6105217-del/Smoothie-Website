from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, Address
from app.schemas.user import UserOut, UserUpdate, AddressCreate, AddressOut

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(User).options(selectinload(User.addresses)).where(User.id == current_user.id)
    )
    user = res.scalars().first()
    return user

@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.name is not None:
        current_user.name = data.name.strip()
    if data.phone is not None:
        current_user.phone = data.phone.strip()

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/addresses", response_model=List[AddressOut])
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Address).where(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    return list(res.scalars().all())

@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.is_default:
        # Reset previous defaults
        existing = await db.execute(select(Address).where(Address.user_id == current_user.id))
        for a in existing.scalars().all():
            a.is_default = False

    addr = Address(
        user_id=current_user.id,
        recipient_name=data.recipient_name,
        phone=data.phone,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        is_default=data.is_default
    )
    db.add(addr)
    await db.commit()
    await db.refresh(addr)
    return addr

@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Address).where(Address.id == address_id, Address.user_id == current_user.id))
    addr = res.scalars().first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    await db.delete(addr)
    await db.commit()
    return {"message": "Address deleted"}
