from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, circles, bills, subscriptions, accounts, prescriptions, flags, notes, appointments
from app.config import settings

app = FastAPI(title='Kin API', version='0.1.0')

allowed_origins = {'http://localhost:5173', settings.frontend_url}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(circles.router, prefix='/api/circles', tags=['circles'])
app.include_router(bills.router, prefix='/api/circles', tags=['bills'])
app.include_router(subscriptions.router, prefix='/api/circles', tags=['subscriptions'])
app.include_router(accounts.router, prefix='/api/circles', tags=['accounts'])
app.include_router(prescriptions.router, prefix='/api/circles', tags=['prescriptions'])
app.include_router(flags.router, prefix='/api/circles', tags=['flags'])
app.include_router(notes.router, prefix='/api/circles', tags=['notes'])
app.include_router(appointments.router, prefix='/api/circles', tags=['appointments'])

@app.get('/health')
def health():
    return {'status': 'ok'}
