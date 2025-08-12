# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_order.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.crud.base import CRUDBase
from app.models.order import Order
from app.models.order_product import OrderProduct  # <-- Corrected model import
from app.models.warehouse import Warehouse
from app.schemas.order import OrderCreate, OrderUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

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

        # System-wide order count milestone (fix: use count/int)
        total_orders = db.query(Order).count()
        check_and_create_milestone(
            db,
            event_type=MilestoneEventType.ORDER_COUNT,
            entity_type=MilestoneEntityType.ORDER,
            entity_id=str(db_obj.id),
            current_count=total_orders,
            description="🎉 A new order milestone has been reached!",
            title="Order milestone",
            milestone_type="order_count"
        )

        # Warehouse-specific order count milestone (notifies warehouse manager)
        if db_obj.warehouse_id:
            wh_orders_count = db.query(Order).filter(Order.warehouse_id == db_obj.warehouse_id).count()
            wh = db.query(Warehouse).get(db_obj.warehouse_id)
            wh_name = wh.name if wh else "Warehouse"
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.ORDER_COUNT,
                entity_type=MilestoneEntityType.WAREHOUSE,
                entity_id=str(db_obj.warehouse_id),
                current_count=wh_orders_count,
                description=f"🎉 {wh_name} reached {wh_orders_count} orders!",
                title=f"{wh_name} Order Milestone",
                milestone_type="warehouse_order_count",
                warehouse_id=str(db_obj.warehouse_id),
            )

        # Check for customer order count milestones
        customer_orders = order.get_multi_by_owner(db, user_id=db_obj.customer_id)
        check_and_create_milestone(
            db,
            event_type=MilestoneEventType.CUSTOMER_ORDER_COUNT,
            entity_type=MilestoneEntityType.CUSTOMER,
            entity_id=db_obj.customer_id,
            current_count=len(customer_orders),
            user_id=db_obj.customer_id,
            description=f"🎉 Customer {db_obj.customer_id} placed their {len(customer_orders)}th order!",
        )
    
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

    def create(self, db: Session, *, obj_in: OrderCreate) -> Order:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e

order = CRUDOrder(Order)