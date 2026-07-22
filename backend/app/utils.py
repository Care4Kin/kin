from datetime import datetime, timezone

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def as_aware(dt: datetime) -> datetime:
    """Our TIMESTAMP columns are stored without a timezone (naive, but always
    UTC in practice since the DB writes them via func.now()). Attach UTC so
    they can be compared against utcnow()."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
