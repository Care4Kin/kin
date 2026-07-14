from sqlalchemy.orm import Session

from app.models.circle_invitation import CircleInvitation
from app.models.circle_member import CircleMember
from app.models.user import User
from app.utils import utcnow

def claim_invitations(user: User, db: Session) -> None:
    """Turn any pending circle invitations for this user's email into real
    memberships. Called right after a new account is created."""
    invites = db.query(CircleInvitation).filter(
        CircleInvitation.email == user.email,
        CircleInvitation.accepted_at.is_(None),
    ).all()
    now = utcnow()
    for inv in invites:
        already_member = db.query(CircleMember).filter(
            CircleMember.circle_id == inv.circle_id,
            CircleMember.caregiver_id == user.user_id,
        ).first()
        if not already_member:
            db.add(CircleMember(
                circle_id=inv.circle_id,
                caregiver_id=user.user_id,
                can_view_bills=inv.can_view_bills,
                can_view_prescriptions=inv.can_view_prescriptions,
                can_view_accounts=inv.can_view_accounts,
                can_view_flags=inv.can_view_flags,
                accepted_at=now,
            ))
        inv.accepted_at = now
    if invites:
        db.commit()
