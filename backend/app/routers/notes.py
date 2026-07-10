from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, require_circle_access
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate

router = APIRouter()

@router.get('/{circle_id}/notes')
def get_notes(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    rows = db.query(Note, User).outerjoin(User, User.user_id == Note.author_id).filter(
        Note.circle_id == circle_id
    ).order_by(Note.created_at.desc()).all()
    return [
        {
            'note_id': n.note_id,
            'content': n.content,
            'author': {'user_id': u.user_id, 'full_name': u.full_name} if u else None,
            'created_at': n.created_at,
        }
        for n, u in rows
    ]

@router.post('/{circle_id}/notes', status_code=201)
def create_note(circle_id: int, body: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    note = Note(circle_id=circle_id, author_id=current_user.user_id, content=body.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        'note_id': note.note_id,
        'content': note.content,
        'author': {'user_id': current_user.user_id, 'full_name': current_user.full_name},
        'created_at': note.created_at,
    }

@router.delete('/{circle_id}/notes/{note_id}')
def delete_note(circle_id: int, note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    note = db.query(Note).filter(Note.note_id == note_id, Note.circle_id == circle_id).first()
    if not note:
        raise HTTPException(404, 'Note not found')
    if note.author_id != current_user.user_id:
        raise HTTPException(403, 'You can only delete your own notes')
    db.delete(note)
    db.commit()
    return {'message': 'Note deleted'}
