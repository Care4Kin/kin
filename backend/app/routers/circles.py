from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_circle_access, require_elder
from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember
from app.models.circle_invitation import CircleInvitation
from app.models.user import User
from app.schemas.circle import MemberInvite, MemberPermissionsUpdate, DigestFrequencyUpdate
from app.services.email import send_email
from app.config import settings

router = APIRouter()

def _permissions(member: CircleMember) -> dict:
    return {
        'can_view_bills': member.can_view_bills,
        'can_view_prescriptions': member.can_view_prescriptions,
        'can_view_accounts': member.can_view_accounts,
        'can_view_flags': member.can_view_flags,
    }

@router.get('/mine')
def get_my_circle(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    user_id = user.user_id

    if user.role == 'elder':
        circle = db.query(FamilyCircle).filter(FamilyCircle.elder_id == user_id).first()
    else:
        # A caregiver could in principle be invited into more than one elder's
        # circle; order deterministically (earliest membership) rather than
        # leaving it to whatever order the DB happens to return.
        membership = db.query(CircleMember).filter(
            CircleMember.caregiver_id == user_id
        ).order_by(CircleMember.membership_id.asc()).first()
        circle = db.query(FamilyCircle).filter(
            FamilyCircle.circle_id == membership.circle_id
        ).first() if membership else None

    if not circle:
        raise HTTPException(404, 'No circle found')

    return {'circle_id': circle.circle_id, 'elder_id': circle.elder_id}

@router.post('', status_code=201)
def create_circle(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'elder':
        raise HTTPException(403, 'Only an elder can create a family circle')
    existing = db.query(FamilyCircle).filter(FamilyCircle.elder_id == current_user.user_id).first()
    if existing:
        return existing
    circle = FamilyCircle(elder_id=current_user.user_id)
    db.add(circle)
    db.commit()
    db.refresh(circle)
    return circle

@router.get('/{circle_id}')
def get_circle(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    elder = db.query(User).filter(User.user_id == circle.elder_id).first()
    rows = db.query(CircleMember, User).join(User, User.user_id == CircleMember.caregiver_id).filter(
        CircleMember.circle_id == circle_id
    ).all()
    pending = db.query(CircleInvitation).filter(
        CircleInvitation.circle_id == circle_id,
        CircleInvitation.accepted_at.is_(None),
    ).all()
    return {
        'circle_id': circle.circle_id,
        'elder': {'user_id': elder.user_id, 'full_name': elder.full_name},
        'members': [
            {
                'membership_id': m.membership_id,
                'user_id': u.user_id,
                'full_name': u.full_name,
                'permissions': _permissions(m),
            }
            for m, u in rows
        ],
        'pending_invitations': [
            {'invitation_id': inv.invitation_id, 'email': inv.email, 'permissions': _permissions(inv)}
            for inv in pending
        ],
    }

@router.post('/{circle_id}/members', status_code=201)
def invite_member(
    circle_id: int,
    body: MemberInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_circle_access),
):
    require_elder(circle, current_user)
    email = body.caregiver_email.strip().lower()
    caregiver = db.query(User).filter(User.email == email).first()

    # Person doesn't have a Kin account yet — record a pending invitation and
    # email them a sign-up link. They join the circle automatically on sign-up.
    if not caregiver:
        pending = db.query(CircleInvitation).filter(
            CircleInvitation.circle_id == circle_id,
            CircleInvitation.email == email,
            CircleInvitation.accepted_at.is_(None),
        ).first()
        if pending:
            pending.can_view_bills = body.can_view_bills
            pending.can_view_prescriptions = body.can_view_prescriptions
            pending.can_view_accounts = body.can_view_accounts
            pending.can_view_flags = body.can_view_flags
        else:
            pending = CircleInvitation(
                circle_id=circle_id,
                email=email,
                can_view_bills=body.can_view_bills,
                can_view_prescriptions=body.can_view_prescriptions,
                can_view_accounts=body.can_view_accounts,
                can_view_flags=body.can_view_flags,
            )
            db.add(pending)
        db.commit()
        db.refresh(pending)

        send_email(
            to=email,
            subject=f'{current_user.full_name} invited you to help on Kin',
            body=(
                f'Hi,\n\n'
                f'{current_user.full_name} invited you to their Kin family circle, '
                'so you can help manage bills, prescriptions, and important accounts together.\n\n'
                f'Create a free account with this email address to join: {settings.frontend_url}/register\n\n'
                '— The Kin Team'
            ),
        )
        return {'invitation_id': pending.invitation_id, 'email': pending.email, 'status': 'pending', 'permissions': _permissions(pending)}

    existing = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id, CircleMember.caregiver_id == caregiver.user_id
    ).first()
    if existing:
        raise HTTPException(409, 'This person is already in your circle')
    member = CircleMember(
        circle_id=circle_id,
        caregiver_id=caregiver.user_id,
        can_view_bills=body.can_view_bills,
        can_view_prescriptions=body.can_view_prescriptions,
        can_view_accounts=body.can_view_accounts,
        can_view_flags=body.can_view_flags,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    send_email(
        to=caregiver.email,
        subject=f'{current_user.full_name} added you to their Kin family circle',
        body=(
            f'Hi {caregiver.full_name},\n\n'
            f'{current_user.full_name} has added you as a caregiver on Kin, '
            'so you can help manage their bills, prescriptions, and important accounts together.\n\n'
            f'Log in to see their dashboard: {settings.frontend_url}/login\n\n'
            '— The Kin Team'
        ),
    )

    return {'membership_id': member.membership_id, 'caregiver_id': member.caregiver_id, 'status': 'added', 'permissions': _permissions(member)}

@router.delete('/{circle_id}/members/{membership_id}')
def remove_member(
    circle_id: int,
    membership_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_circle_access),
):
    require_elder(circle, current_user)
    member = db.query(CircleMember).filter(
        CircleMember.membership_id == membership_id, CircleMember.circle_id == circle_id
    ).first()
    if not member:
        raise HTTPException(404, 'Member not found')
    db.delete(member)
    db.commit()
    return {'message': 'Member removed'}

@router.patch('/{circle_id}/members/{membership_id}')
def update_member_permissions(
    circle_id: int,
    membership_id: int,
    body: MemberPermissionsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_circle_access),
):
    require_elder(circle, current_user)
    member = db.query(CircleMember).filter(
        CircleMember.membership_id == membership_id, CircleMember.circle_id == circle_id
    ).first()
    if not member:
        raise HTTPException(404, 'Member not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(member, k, v)
    db.commit()
    db.refresh(member)
    return {'membership_id': member.membership_id, 'permissions': _permissions(member)}

@router.delete('/{circle_id}/invitations/{invitation_id}')
def cancel_invitation(
    circle_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_circle_access),
):
    require_elder(circle, current_user)
    invitation = db.query(CircleInvitation).filter(
        CircleInvitation.invitation_id == invitation_id,
        CircleInvitation.circle_id == circle_id,
        CircleInvitation.accepted_at.is_(None),
    ).first()
    if not invitation:
        raise HTTPException(404, 'Invitation not found')
    db.delete(invitation)
    db.commit()
    return {'message': 'Invitation cancelled'}

@router.get('/{circle_id}/digest-frequency')
def get_my_digest_frequency(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    circle=Depends(require_circle_access),
    db: Session = Depends(get_db),
):
    member = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id, CircleMember.caregiver_id == current_user.user_id
    ).first()
    if not member:
        raise HTTPException(404, 'Digest preferences are only available to caregivers in a circle')
    return {'digest_frequency': member.digest_frequency}

@router.patch('/{circle_id}/digest-frequency')
def update_my_digest_frequency(
    circle_id: int,
    body: DigestFrequencyUpdate,
    current_user: User = Depends(get_current_user),
    circle=Depends(require_circle_access),
    db: Session = Depends(get_db),
):
    # Self-service by design -- a caregiver sets their own email cadence, so
    # this isn't gated behind require_elder like the permission checkboxes.
    member = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id, CircleMember.caregiver_id == current_user.user_id
    ).first()
    if not member:
        raise HTTPException(404, 'Digest preferences are only available to caregivers in a circle')
    member.digest_frequency = body.digest_frequency
    db.commit()
    db.refresh(member)
    return {'digest_frequency': member.digest_frequency}
