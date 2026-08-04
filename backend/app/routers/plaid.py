import statistics
from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from plaid.exceptions import ApiException
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.item_remove_request import ItemRemoveRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from app.database import get_db
from app.middleware.auth import get_current_user, require_elder, require_permission
from app.models.plaid_item import PlaidItem
from app.models.user import User
from app.schemas.plaid import LinkTokenOut, ExchangeTokenRequest, DismissSuggestionRequest
from app.services.groq_client import assess_bank_transaction_risk, groq_configured
from app.services.plaid_client import get_plaid_client, plaid_configured
from app.services.plaid_suggestions import dismiss_suggestion, dismissed_keys

router = APIRouter()
require_accounts_access = require_permission('can_view_accounts')
require_flags_access = require_permission('can_view_flags')

# Plaid's personal_finance_category.primary values that look like recurring
# bills vs. recurring subscriptions. Anything outside both sets (groceries,
# transport, travel, etc.) is recurring-but-not-actionable, so it's excluded
# from both detectors rather than guessed at.
BILL_CATEGORIES = {'RENT_AND_UTILITIES', 'LOAN_PAYMENTS', 'MEDICAL', 'GOVERNMENT_AND_NON_PROFIT', 'BANK_FEES'}
SUBSCRIPTION_CATEGORIES = {'ENTERTAINMENT', 'GENERAL_SERVICES'}

def _require_plaid_configured():
    if not plaid_configured():
        raise HTTPException(400, 'Bank connections are not set up for this app yet')

def _fetch_all_transactions(client, access_token: str) -> list:
    transactions = []
    cursor = None
    while True:
        request = TransactionsSyncRequest(access_token=access_token, cursor=cursor) if cursor else TransactionsSyncRequest(access_token=access_token)
        try:
            response = client.transactions_sync(request).to_dict()
        except ApiException as e:
            raise HTTPException(502, f'Could not fetch transactions from the bank: {e.reason}')
        transactions.extend(response.get('added', []))
        cursor = response.get('next_cursor')
        if not response.get('has_more'):
            break
    return transactions

@router.post('/{circle_id}/plaid/link-token', response_model=LinkTokenOut)
def create_link_token(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    circle=Depends(require_accounts_access),
):
    require_elder(circle, current_user)
    _require_plaid_configured()
    client = get_plaid_client()
    request = LinkTokenCreateRequest(
        products=[Products('transactions')],
        client_name='Kin',
        country_codes=[CountryCode('US')],
        language='en',
        user=LinkTokenCreateRequestUser(client_user_id=str(current_user.user_id)),
    )
    try:
        response = client.link_token_create(request)
    except ApiException as e:
        raise HTTPException(502, f'Could not start bank connection: {e.reason}')
    return {'link_token': response.to_dict()['link_token']}

@router.post('/{circle_id}/plaid/exchange', status_code=201)
def exchange_public_token(
    circle_id: int,
    body: ExchangeTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_accounts_access),
):
    require_elder(circle, current_user)
    _require_plaid_configured()
    client = get_plaid_client()
    try:
        response = client.item_public_token_exchange(
            ItemPublicTokenExchangeRequest(public_token=body.public_token)
        ).to_dict()
    except ApiException as e:
        raise HTTPException(502, f'Could not link that bank: {e.reason}')

    item = PlaidItem(
        circle_id=circle_id,
        item_id=response['item_id'],
        access_token=response['access_token'],
        institution_name=body.institution_name,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {'plaid_item_id': item.plaid_item_id, 'institution_name': item.institution_name}

@router.get('/{circle_id}/plaid/accounts')
def get_linked_accounts(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_accounts_access)):
    _require_plaid_configured()
    client = get_plaid_client()
    items = db.query(PlaidItem).filter(PlaidItem.circle_id == circle_id).all()
    result = []
    for item in items:
        try:
            response = client.accounts_get(AccountsGetRequest(access_token=item.access_token)).to_dict()
        except ApiException as e:
            raise HTTPException(502, f'Could not fetch accounts: {e.reason}')
        for acct in response.get('accounts', []):
            balances = acct.get('balances', {})
            result.append({
                'plaid_item_id': item.plaid_item_id,
                'institution_name': item.institution_name,
                'account_id': acct.get('account_id'),
                'name': acct.get('name'),
                'mask': acct.get('mask'),
                'type': acct.get('type'),
                'subtype': acct.get('subtype'),
                'current_balance': balances.get('current'),
                'available_balance': balances.get('available'),
            })
    return result

@router.get('/{circle_id}/plaid/spending')
def get_spending_breakdown(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_accounts_access)):
    _require_plaid_configured()
    client = get_plaid_client()
    items = db.query(PlaidItem).filter(PlaidItem.circle_id == circle_id).all()

    totals = defaultdict(float)
    for item in items:
        for txn in _fetch_all_transactions(client, item.access_token):
            amount = txn.get('amount') or 0
            if amount <= 0:
                continue  # Plaid convention: positive amount = money out (spending)
            category = ((txn.get('personal_finance_category') or {}).get('primary') or 'OTHER').replace('_', ' ').title()
            totals[category] += amount

    breakdown = [{'category': cat, 'amount': round(amt, 2)} for cat, amt in totals.items()]
    breakdown.sort(key=lambda r: r['amount'], reverse=True)
    return breakdown

def _merchant_key(txn) -> str:
    # merchant_entity_id is a stable, Plaid-generated ID for the real-world
    # merchant, so charges group correctly even when the descriptor string
    # varies between statements (e.g. "COMCAST" vs "COMCAST CABLE COMM").
    # Falls back to the normalized name when Plaid can't resolve an entity
    # (common in sandbox/test data and for smaller merchants).
    entity_id = txn.get('merchant_entity_id')
    if entity_id:
        return f'entity:{entity_id}'
    name = (txn.get('merchant_name') or txn.get('name') or 'Unknown').strip().lower()
    return f'name:{name}'

def _detect_recurring_charges(client, items) -> list:
    groups = defaultdict(list)
    for item in items:
        for txn in _fetch_all_transactions(client, item.access_token):
            amount = txn.get('amount') or 0
            if amount <= 0:
                continue
            groups[_merchant_key(txn)].append(txn)

    recurring = []
    for key, txns in groups.items():
        if len(txns) < 2:
            continue
        amounts = [t.get('amount') or 0 for t in txns]
        avg = sum(amounts) / len(amounts)
        if avg <= 0:
            continue
        # Only call it recurring if the amounts are consistent (a real subscription
        # or bill charges roughly the same amount each time) and it happened in
        # more than one calendar month, not just multiple times in one week.
        within_tolerance = all(abs(a - avg) <= max(avg * 0.15, 1.0) for a in amounts)
        # Plaid returns `date` as a datetime.date object, not a string.
        months = {str(t['date'])[:7] for t in txns if t.get('date')}
        if not within_tolerance or len(months) < 2:
            continue
        display_name = txns[0].get('merchant_name') or txns[0].get('name') or 'Unknown'
        dates = sorted([t.get('date') for t in txns if t.get('date')])
        category = (txns[0].get('personal_finance_category') or {}).get('primary') or 'OTHER'
        recurring.append({
            'merchant': display_name,
            'source_key': key,
            'average_amount': round(avg, 2),
            'occurrences': len(txns),
            'last_date': dates[-1] if dates else None,
            'category': category,
        })

    recurring.sort(key=lambda s: s['average_amount'], reverse=True)
    return recurring

@router.get('/{circle_id}/plaid/subscriptions')
def get_detected_subscriptions(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_accounts_access)):
    _require_plaid_configured()
    client = get_plaid_client()
    items = db.query(PlaidItem).filter(PlaidItem.circle_id == circle_id).all()
    dismissed = dismissed_keys(db, circle_id)
    return [
        r for r in _detect_recurring_charges(client, items)
        if r['category'] in SUBSCRIPTION_CATEGORIES and r['source_key'] not in dismissed
    ]

@router.get('/{circle_id}/plaid/bills')
def get_detected_bills(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_accounts_access)):
    _require_plaid_configured()
    client = get_plaid_client()
    items = db.query(PlaidItem).filter(PlaidItem.circle_id == circle_id).all()
    dismissed = dismissed_keys(db, circle_id)
    return [
        r for r in _detect_recurring_charges(client, items)
        if r['category'] in BILL_CATEGORIES and r['source_key'] not in dismissed
    ]

def _detect_suspicious_transactions(client, items) -> list:
    """Heuristic only, not a fraud model: flags a transaction as worth a second
    look if it's a large outlier for that specific account (more than 3x that
    account's own median transaction, and at least $500), over the last 90
    days. Capped to the largest few so this stays a short, actionable list --
    the AI risk assessment below is what actually decides whether it's shown."""
    cutoff = date.today() - timedelta(days=90)
    candidates = []
    for item in items:
        txns = [
            t for t in _fetch_all_transactions(client, item.access_token)
            if (t.get('amount') or 0) > 0 and t.get('date') and t['date'] >= cutoff
        ]
        if len(txns) < 3:
            continue  # not enough history on this account to judge what's normal
        median = statistics.median(t['amount'] for t in txns)
        threshold = max(500, 3 * median)
        candidates.extend(t for t in txns if t['amount'] > threshold)

    candidates.sort(key=lambda t: t['amount'], reverse=True)
    return candidates[:5]

@router.get('/{circle_id}/plaid/flags')
def get_detected_suspicious_transactions(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    _require_plaid_configured()
    if not groq_configured():
        return []
    client = get_plaid_client()
    items = db.query(PlaidItem).filter(PlaidItem.circle_id == circle_id).all()
    dismissed = dismissed_keys(db, circle_id)

    results = []
    for txn in _detect_suspicious_transactions(client, items):
        source_key = f"txn:{txn.get('transaction_id')}"
        if source_key in dismissed:
            continue
        merchant = txn.get('merchant_name') or txn.get('name') or 'Unknown'
        category = (txn.get('personal_finance_category') or {}).get('primary') or 'OTHER'
        try:
            assessment = assess_bank_transaction_risk(merchant, txn['amount'], category)
        except Exception as e:
            print(f'suspicious transaction assessment failed for circle {circle_id}: {e}')
            continue
        if assessment.risk_level == 'low':
            continue
        results.append({
            'merchant': merchant,
            'amount': round(txn['amount'], 2),
            'date': str(txn.get('date')),
            'category': category,
            'source_key': source_key,
            'risk_level': assessment.risk_level,
            'explanation': assessment.explanation,
            'suggested_action': assessment.suggested_action,
        })
    return results

@router.post('/{circle_id}/plaid/dismiss', status_code=201)
def dismiss_detected_suggestion(
    circle_id: int,
    body: DismissSuggestionRequest,
    db: Session = Depends(get_db),
    circle=Depends(require_accounts_access),
):
    dismiss_suggestion(db, circle_id, body.source_key)
    return {'message': 'Suggestion dismissed'}

@router.delete('/{circle_id}/plaid/items/{plaid_item_id}')
def remove_linked_item(
    circle_id: int,
    plaid_item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    circle=Depends(require_accounts_access),
):
    require_elder(circle, current_user)
    item = db.query(PlaidItem).filter(
        PlaidItem.plaid_item_id == plaid_item_id, PlaidItem.circle_id == circle_id
    ).first()
    if not item:
        raise HTTPException(404, 'Linked account not found')

    if plaid_configured():
        client = get_plaid_client()
        try:
            client.item_remove(ItemRemoveRequest(access_token=item.access_token))
        except ApiException:
            pass  # already revoked or gone on Plaid's side — still remove our record

    db.delete(item)
    db.commit()
    return {'message': 'Bank connection removed'}
