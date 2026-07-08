from typing import Optional
from pydantic import BaseModel

class MemberInvite(BaseModel):
    caregiver_email: str
    can_view_bills: bool = True
    can_view_prescriptions: bool = True
    can_view_accounts: bool = True
    can_view_flags: bool = True

class MemberPermissionsUpdate(BaseModel):
    can_view_bills: Optional[bool] = None
    can_view_prescriptions: Optional[bool] = None
    can_view_accounts: Optional[bool] = None
    can_view_flags: Optional[bool] = None
