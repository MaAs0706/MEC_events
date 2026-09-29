from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

# The admin dashboard legitimately makes several independent, read-only calls
# at once (users, venues, events, notifications and analytics). Five total
# connections caused those calls to starve one another when using Supabase's
# Session Pooler. These defaults leave room for a normal dashboard load while
# still staying deliberately small for a single-process internal deployment.
# Production operators can tune every value through environment variables.
engine_options = {"pool_pre_ping": True}
if not DATABASE_URL.startswith("sqlite"):
    engine_options.update(
        pool_size=int(os.getenv("DB_POOL_SIZE", "8")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "2")),
        pool_timeout=int(os.getenv("DB_POOL_TIMEOUT_SECONDS", "5")),
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE_SECONDS", "1800")),
    )

engine = create_engine(DATABASE_URL, **engine_options)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base() ## This is the base class for all the models in the application. All the models will inherit from this class.(For eg this tells python that it is not just a normal method , we are referring to a database and all the tables should inherit from it . )
