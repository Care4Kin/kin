import bcrypt
from datetime import date, time
from app.database import engine, Base
from app.models.user import User
from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember
from app.models.bill import Bill
from app.models.subscription import Subscription
from app.models.prescription import Prescription
from app.models.account import Account
from app.models.flag import Flag
from app.models.note import Note
from app.models.appointment import Appointment
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

with Session(engine) as db:

    # ── Users ──────────────────────────────────────────────────────
    elder = db.query(User).filter(User.email == 'dev@kin.app').first()
    if not elder:
        elder = User(email='dev@kin.app', password_hash=hash_pw('password123'),
                     full_name='Margaret Johnson', role='elder', phone='555-0100',
                     security_question="What was your first pet's name?",
                     security_answer_hash=hash_pw('biscuit'))
        db.add(elder)
        db.flush()

    caregiver = db.query(User).filter(User.email == 'caregiver@kin.app').first()
    if not caregiver:
        caregiver = User(email='caregiver@kin.app', password_hash=hash_pw('password123'),
                         full_name='David Johnson', role='caregiver', phone='555-0101',
                         security_question="What city were you born in?",
                         security_answer_hash=hash_pw('columbus'))
        db.add(caregiver)
        db.flush()

    # ── Family circle ──────────────────────────────────────────────
    circle = db.query(FamilyCircle).filter(FamilyCircle.elder_id == elder.user_id).first()
    if not circle:
        circle = FamilyCircle(elder_id=elder.user_id)
        db.add(circle)
        db.flush()

    member = db.query(CircleMember).filter(
        CircleMember.circle_id == circle.circle_id,
        CircleMember.caregiver_id == caregiver.user_id,
    ).first()
    if not member:
        db.add(CircleMember(
            circle_id=circle.circle_id,
            caregiver_id=caregiver.user_id,
            can_view_bills=True,
            can_view_prescriptions=True,
            can_view_accounts=True,
            can_view_flags=True,
        ))

    # ── Bills ──────────────────────────────────────────────────────
    if not db.query(Bill).filter(Bill.circle_id == circle.circle_id).first():
        db.add_all([
            Bill(circle_id=circle.circle_id, name='Rent',
                 amount=1400.00, due_date=date(2026, 7, 1),  is_paid=True,  category='housing'),
            Bill(circle_id=circle.circle_id, name='Electric Bill',
                 amount=87.50,  due_date=date(2026, 7, 15), is_paid=False, category='utility'),
            Bill(circle_id=circle.circle_id, name='Water & Sewer',
                 amount=42.00,  due_date=date(2026, 7, 20), is_paid=False, category='utility'),
            Bill(circle_id=circle.circle_id, name='Medicare Part B Premium',
                 amount=174.70, due_date=date(2026, 7, 10), is_paid=True,  category='healthcare'),
            Bill(circle_id=circle.circle_id, name='Car Insurance',
                 amount=112.00, due_date=date(2026, 7, 22), is_paid=False, category='insurance'),
            Bill(circle_id=circle.circle_id, name='Phone Bill',
                 amount=55.00,  due_date=date(2026, 7, 28), is_paid=False, category='utility'),
        ])

    # ── Subscriptions ──────────────────────────────────────────────
    if not db.query(Subscription).filter(Subscription.circle_id == circle.circle_id).first():
        db.add_all([
            Subscription(circle_id=circle.circle_id, name='Netflix',        monthly_cost=15.49, is_active=True),
            Subscription(circle_id=circle.circle_id, name='AARP Membership',monthly_cost=4.17,  is_active=True),
            Subscription(circle_id=circle.circle_id, name='iCloud Storage', monthly_cost=2.99,  is_active=True),
            Subscription(circle_id=circle.circle_id, name='Newspaper (Digital)', monthly_cost=9.99, is_active=True),
            Subscription(circle_id=circle.circle_id, name='Old Gym Membership', monthly_cost=39.99, is_active=False),
        ])

    # ── Prescriptions ──────────────────────────────────────────────
    if not db.query(Prescription).filter(Prescription.circle_id == circle.circle_id).first():
        db.add_all([
            Prescription(circle_id=circle.circle_id, medication_name='Lisinopril',
                         dosage='10mg once daily', prescribing_doctor='Dr. Sandra Chen',
                         pharmacy_name='CVS Pharmacy – Oak St', refill_date=date(2026, 7, 18),
                         is_active=True, notes='Take in the morning with water'),
            Prescription(circle_id=circle.circle_id, medication_name='Metformin',
                         dosage='500mg twice daily', prescribing_doctor='Dr. Sandra Chen',
                         pharmacy_name='CVS Pharmacy – Oak St', refill_date=date(2026, 7, 25),
                         is_active=True, notes='Take with meals to reduce stomach upset'),
            Prescription(circle_id=circle.circle_id, medication_name='Atorvastatin',
                         dosage='20mg once daily', prescribing_doctor='Dr. Sandra Chen',
                         pharmacy_name='CVS Pharmacy – Oak St', refill_date=date(2026, 8, 5),
                         is_active=True, notes='Take at bedtime'),
            Prescription(circle_id=circle.circle_id, medication_name='Vitamin D3',
                         dosage='1000 IU daily', prescribing_doctor='Dr. Sandra Chen',
                         pharmacy_name='Walgreens – Main Ave', refill_date=date(2026, 9, 1),
                         is_active=True, notes=''),
        ])

    # ── Accounts ──────────────────────────────────────────────────
    if not db.query(Account).filter(Account.circle_id == circle.circle_id).first():
        db.add_all([
            Account(circle_id=circle.circle_id, name='Chase Checking',
                    category='bank', notes='Primary checking account. Branch on Oak St.'),
            Account(circle_id=circle.circle_id, name='Social Security',
                    category='government', notes='Deposited on the 3rd of each month'),
            Account(circle_id=circle.circle_id, name='Medicare',
                    category='healthcare', notes='Medicare number is on the red-white-blue card in wallet'),
            Account(circle_id=circle.circle_id, name='AARP Supplemental Insurance',
                    category='insurance', notes='Call 1-800-523-5800 for claims'),
            Account(circle_id=circle.circle_id, name='CVS ExtraCare',
                    category='pharmacy', notes='Rewards card is on keychain'),
        ])

    # ── Flags ──────────────────────────────────────────────────────
    if not db.query(Flag).filter(Flag.circle_id == circle.circle_id).first():
        db.add_all([
            Flag(circle_id=circle.circle_id, created_by=elder.user_id,
                 type='call', severity='high', is_resolved=False,
                 description='Received a call saying my Medicare was being cancelled and I needed to pay $300 immediately to keep it. The caller had a foreign accent and would not give a callback number.'),
            Flag(circle_id=circle.circle_id, created_by=elder.user_id,
                 type='email', severity='low', is_resolved=True,
                 description='Got an email claiming I won a $500 Amazon gift card. Had a strange link that did not look like Amazon.'),
            Flag(circle_id=circle.circle_id, created_by=caregiver.user_id,
                 type='bill', severity='low', is_resolved=False,
                 description='Received a bill from a medical lab I don\'t recognize — "National Diagnostics LLC." Could be legitimate from the last blood draw but the amount seems high at $340.'),
        ])

    # ── Notes ─────────────────────────────────────────────────────
    if not db.query(Note).filter(Note.circle_id == circle.circle_id).first():
        db.add_all([
            Note(circle_id=circle.circle_id, author_id=caregiver.user_id,
                 content='Mom — I called CVS and they said the Lisinopril refill is ready for pickup. I can grab it Saturday when I visit. Let me know if you need anything else!'),
            Note(circle_id=circle.circle_id, author_id=elder.user_id,
                 content='David — don\'t worry about the electric bill, I already mailed the check. Also the plumber is coming Tuesday between 10 and noon.'),
            Note(circle_id=circle.circle_id, author_id=elder.user_id,
                 content='Reminder to myself: appointment with Dr. Chen is July 14th at 2:30pm. David can you drive me?'),
        ])

    # ── Appointments ─────────────────────────────────────────────────
    if not db.query(Appointment).filter(Appointment.circle_id == circle.circle_id).first():
        db.add_all([
            Appointment(circle_id=circle.circle_id, title='Dr. Chen — Annual Checkup',
                        date=date(2026, 7, 14), time=time(14, 30),
                        location='Oak St Medical Center, Suite 200',
                        notes='David is driving. Bring insurance card and medication list.'),
            Appointment(circle_id=circle.circle_id, title='Eye Exam',
                        date=date(2026, 8, 3), time=time(10, 0),
                        location='Main Ave Vision Center', notes=''),
        ])

    db.commit()
    print(f'Done! Circle ID: {circle.circle_id}')
    print(f'  Elder:     Margaret Johnson  — dev@kin.app / password123')
    print(f'  Caregiver: David Johnson     — caregiver@kin.app / password123')
