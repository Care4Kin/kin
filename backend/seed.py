import bcrypt
from app.database import engine, Base
from app.models.user import User
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

with Session(engine) as db:
    if not db.query(User).filter(User.email == 'dev@kin.app').first():
        db.add(User(email='dev@kin.app', password_hash=hash_pw('password123'),
                    full_name='Dev Elder', role='elder', phone='555-0100'))
    if not db.query(User).filter(User.email == 'caregiver@kin.app').first():
        db.add(User(email='caregiver@kin.app', password_hash=hash_pw('password123'),
                    full_name='Dev Caregiver', role='caregiver', phone='555-0101'))
    db.commit()
    print('Done — tables created and dev users seeded.')
