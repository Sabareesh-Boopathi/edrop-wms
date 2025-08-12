# filepath: backend/app/api/endpoints/notifications.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app import crud, schemas

router = APIRouter()

@router.get("/me", response_model=List[schemas.Notification])
def get_my_notifications(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 50,
):
    return crud.notification.get_for_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/me/unread-count", response_model=int)
def get_my_unread_count(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    return crud.notification.get_unread_count(db, user_id=current_user.id)

@router.post("/me/{notification_id}/read", response_model=schemas.Notification)
def mark_as_read(
    notification_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    notif = crud.notification.get(db, id=notification_id)
    if not notif or str(notif.user_id) != str(current_user.id):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return crud.notification.update(db, db_obj=notif, obj_in=schemas.NotificationUpdate(is_read=True))
