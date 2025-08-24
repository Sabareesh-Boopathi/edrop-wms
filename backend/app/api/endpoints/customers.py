from fastapi import APIRouter, Depends, HTTPException
from fastapi import Body
from sqlalchemy.orm import Session
import logging
from typing import List
import uuid

from app import crud, models, schemas
from app.core.privacy import mask_contact_dict
from app.schemas.privacy import UnmaskRequest, UnmaskResponse
from app.models.audit_log import AuditLog
from datetime import datetime
from app.api import deps

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.customers")

@router.get("/me", response_model=schemas.Customer)
def read_customer_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get current user's customer profile.
    """
    logger.info(f"ℹ️ Endpoint /customers/me called by user: {current_user.email} (id: {current_user.id})")
    customer = crud.customer.get_by_user_id(db, user_id=current_user.id)
    if not customer:
        logger.warning(f"❌ No customer profile found for user_id: {current_user.id}")
        raise HTTPException(status_code=404, detail="Customer profile not found for the current user")
    logger.info(f"✅ Found customer profile (id: {customer.id}) for user_id: {current_user.id}")
    return customer

@router.get("/", response_model=List[schemas.Customer])
@router.get("", response_model=List[schemas.Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve customer profiles. Allowed for ADMIN/MANAGER/OPERATOR; blocked for VIEWER.
    This loosens the previous superuser-only restriction so managers can create inbound receipts
    where the UI preloads customers.
    """
    role = str(getattr(current_user, "role", "")).lower()
    allowed = {"admin", "manager", "operator", "warehouse_manager"}
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Insufficient privileges to list customers")
    customers = crud.customer.get_multi(db, skip=skip, limit=limit)
    # Mask PII by default
    masked = []
    for c in customers:
        d = schemas.Customer.model_validate(c).model_dump()
        d = mask_contact_dict(d, phone_key="phone_number", email_key="email")
        masked.append(d)
    return masked

# --- Start of Corrected Endpoints ---

@router.post("/", response_model=schemas.Customer)
@router.post("", response_model=schemas.Customer)
def create_customer(
    payload: dict = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create a new customer. Accepts CustomerCreate shape with name/phone/email/community_id.
    """
    # Normalize incoming data
    phone_number = (payload.get("phone_number") or payload.get("phone") or "").strip() or None
    email = (payload.get("email") or "").strip() or None
    name = (payload.get("name") or "Customer").strip() or "Customer"
    community_id = payload.get("community_id") or None
    address_id = payload.get("address_id") or None
    block = (payload.get("block") or "").strip() or None
    flat_number = (payload.get("flat_number") or "").strip() or None
    status = payload.get("status") or "ACTIVE"
    notes = (payload.get("notes") or "").strip() or None

    # Validate that customer has either community_id OR address_id, but not both
    if community_id and address_id:
        raise HTTPException(status_code=422, detail="Customer cannot have both community_id and address_id")
    if not community_id and not address_id:
        raise HTTPException(status_code=422, detail="Customer must have either community_id or address_id")

    # Build the strict schema for persistence
    from app.schemas.customer import CustomerCreate as _CustomerCreate
    c_in = _CustomerCreate(
        name=name,
        phone_number=phone_number or "",
        email=email or "",
        community_id=community_id,
        address_id=address_id,
        block=block,
        flat_number=flat_number,
        status=status,
        notes=notes,
    )

    logger.info(f"📝 User '{current_user.id}' creating customer: {name}")
    new_customer = crud.customer.create(db, obj_in=c_in)
    logger.info(f"✅ Customer '{new_customer.id}' created successfully by user '{current_user.id}'.")
    return new_customer

@router.get("/{customer_id}", response_model=schemas.Customer)
def read_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"🔎 User '{current_user.id}' requesting customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    # Mask PII by default
    d = schemas.Customer.model_validate(db_customer).model_dump()
    return mask_contact_dict(d, phone_key="phone_number", email_key="email")


@router.post("/{customer_id}:unmask", response_model=UnmaskResponse)
def unmask_customer_contact(
    customer_id: uuid.UUID,
    payload: UnmaskRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Return full phone/email with justification, and record an audit log."""
    cust = crud.customer.get(db, id=customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    # Record audit
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="customer_contact_unmask",
            entity_id=str(customer_id),
            action="unmask",
            changes={"reason": {"before": None, "after": payload.reason}},
        )
    )
    db.commit()
    return UnmaskResponse(
        id=cust.id,
        name=cust.name,
        phone_number=cust.phone_number,
        email=cust.email,
        entity_type="customer",
        entity_id=str(customer_id),
    revealed_at=datetime.utcnow(),
    )

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: uuid.UUID,
    customer_in: schemas.CustomerUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"📝 User '{current_user.id}' attempting to update customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    updated_customer = crud.customer.update(db, db_obj=db_customer, obj_in=customer_in)
    logger.info(f"✅ Customer '{updated_customer.id}' updated successfully by user '{current_user.id}'.")
    return updated_customer

@router.delete("/{customer_id}", response_model=schemas.Customer)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"🗑️ Admin '{current_user.id}' attempting to delete customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    deleted_customer = crud.customer.remove(db, id=customer_id)
    logger.info(f"✅ Customer '{deleted_customer.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_customer