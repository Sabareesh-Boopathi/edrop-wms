# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_order.py
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.order import Order
from app.models.order_product import OrderProduct  # <-- Corrected model import
from app.schemas.order import OrderCreate, OrderUpdate

class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    def create_with_items(self, db: Session, *, obj_in: OrderCreate) -> Order:
        # Calculate total_amount from items
        total_amount = sum(float(item.price) * item.quantity for item in obj_in.items)
        # Remove items from obj_in before creating the order
        order_data = obj_in.model_dump(exclude={"items"})
        order_data["total_amount"] = total_amount
        db_obj = self.model(**order_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        # Associate items with the order
        for item in obj_in.items:
            order_product_obj = OrderProduct(
                order_id=db_obj.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price
            )
            db.add(order_product_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

order = CRUDOrder(Order)