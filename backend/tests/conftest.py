import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_diy_store.db"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False, class_=AsyncSession)

@pytest_asyncio.fixture(scope="session")
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session(setup_test_db):
    async with TestSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def client(setup_test_db):
    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def customer_user(db_session: AsyncSession):
    from sqlalchemy.future import select
    res = await db_session.execute(select(User).where(User.email == "customer_test@example.com"))
    user = res.scalars().first()
    if not user:
        user = User(
            name="Test Customer",
            email="customer_test@example.com",
            phone="+919876543211",
            password_hash=hash_password("Customer@1234"),
            role="CUSTOMER",
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def owner_user(db_session: AsyncSession):
    from sqlalchemy.future import select
    res = await db_session.execute(select(User).where(User.email == "karthik.suroju@gmail.com"))
    owner = res.scalars().first()
    if not owner:
        owner = User(
            name="Karthik",
            email="karthik.suroju@gmail.com",
            phone="+918555997052",
            password_hash=hash_password("OwnerAdmin@2026!"),
            role="OWNER",
            is_active=True
        )
        db_session.add(owner)
        await db_session.commit()
        await db_session.refresh(owner)
    return owner

@pytest.fixture
def customer_token(customer_user: User):
    return create_access_token(subject=customer_user.id, role=customer_user.role)

@pytest.fixture
def owner_token(owner_user: User):
    return create_access_token(subject=owner_user.id, role=owner_user.role)
