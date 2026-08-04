from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.plaid_dismissed_suggestion import PlaidDismissedSuggestion

def stage_dismiss_suggestion(db: Session, circle_id: int, source_key: str) -> None:
    """Adds a dismissal row to the session without committing. Use this inside
    an endpoint that's already about to commit its own work (e.g. creating a
    bill from a suggestion) so the whole request is one transaction — calling
    db.commit() twice in the same request expires already-loaded objects like
    the just-created bill, wiping them before the response is serialized."""
    exists = db.query(PlaidDismissedSuggestion).filter(
        PlaidDismissedSuggestion.circle_id == circle_id,
        PlaidDismissedSuggestion.source_key == source_key,
    ).first()
    if exists:
        return
    db.add(PlaidDismissedSuggestion(circle_id=circle_id, source_key=source_key))

def dismiss_suggestion(db: Session, circle_id: int, source_key: str) -> None:
    """Permanently hides a detected bank suggestion for this circle. For
    standalone use (the explicit "Not Now" action) where nothing else in the
    request needs to commit — once handled, a suggestion shouldn't come back
    just because the resulting bill/subscription gets renamed or deleted."""
    stage_dismiss_suggestion(db, circle_id, source_key)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()

def dismissed_keys(db: Session, circle_id: int) -> set:
    rows = db.query(PlaidDismissedSuggestion.source_key).filter(
        PlaidDismissedSuggestion.circle_id == circle_id,
    ).all()
    return {r[0] for r in rows}
