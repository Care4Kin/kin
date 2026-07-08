from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_circle_access
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate

router = APIRouter()

@router.get('/{circle_id}/accounts')
def get_accounts(circle_id: int, category: Optional[str] = None, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    query = db.query(Account).filter(Account.circle_id == circle_id)
    if category is not None:
        query = query.filter(Account.category == category)
    return query.order_by(Account.category, Account.name).all()

@router.post('/{circle_id}/accounts', status_code=201)
def create_account(circle_id: int, body: AccountCreate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    account = Account(circle_id=circle_id, **body.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.patch('/{circle_id}/accounts/{account_id}')
def update_account(circle_id: int, account_id: int, body: AccountUpdate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    account = db.query(Account).filter(Account.account_id == account_id, Account.circle_id == circle_id).first()
    if not account:
        raise HTTPException(404, 'Account not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(account, k, v)
    db.commit()
    db.refresh(account)
    return account

@router.delete('/{circle_id}/accounts/{account_id}')
def delete_account(circle_id: int, account_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    account = db.query(Account).filter(Account.account_id == account_id, Account.circle_id == circle_id).first()
    if not account:
        raise HTTPException(404, 'Account not found')
    db.delete(account)
    db.commit()
    return {'message': 'Account deleted'}
