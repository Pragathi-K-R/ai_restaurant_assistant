"""
Order Service — Business logic for order creation and state transitions.
Handles tax calculation (GST 5%), fetching current menu prices, and stock updates.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from typing import Tuple, List, Optional
from app.models.all_models import Order, OrderItem, OrderStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.menu_repository import MenuRepository
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
import logging

logger = logging.getLogger(__name__)

TAX_RATE = 0.05  # 5% GST

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OrderRepository(db)
        self.menu_repo = MenuRepository(db)



    async def create_order(self, user_id: int, data: OrderCreate) -> OrderResponse:
        subtotal = 0.0
        db_items = []

        # Process items to calculate total and verify availability
        for item_data in data.items:
            menu_item = await self.menu_repo.get_by_id(item_data.menu_item_id)
            if not menu_item:
                raise HTTPException(status_code=400, detail=f"Menu item ID {item_data.menu_item_id} not found.")
            if not menu_item.is_available:
                raise HTTPException(status_code=400, detail=f"Item '{menu_item.name}' is currently unavailable.")

            # Calculate price
            item_price = menu_item.price
            line_total = item_price * item_data.quantity
            subtotal += float(line_total)

            # Create OrderItem model
            db_item = OrderItem(
                menu_item_id=menu_item.id,
                quantity=item_data.quantity,
                unit_price=item_price,
                total_price=line_total,
                notes=item_data.notes
            )
            db_items.append(db_item)

        # Calculate final amounts
        subtotal_after_discount = max(0.0, subtotal - data.discount_amount)
        tax_amount = subtotal_after_discount * TAX_RATE
        total_amount = subtotal_after_discount + tax_amount

        # Resolve target customer_id
        target_customer_id = data.customer_id
        if not target_customer_id and user_id:
            from app.models.user import User
            from app.models.all_models import Customer
            from sqlalchemy import or_

            user_res = await self.db.execute(select(User).where(User.id == user_id))
            user_obj = user_res.scalar_one_or_none()

            if user_obj:
                cust_res = await self.db.execute(
                    select(Customer).where(
                        or_(Customer.email == user_obj.email, Customer.name == user_obj.full_name)
                    )
                )
                cust_obj = cust_res.scalars().first()
                if cust_obj:
                    target_customer_id = cust_obj.id
                else:
                    first_cust = await self.db.execute(select(Customer).order_by(Customer.id.asc()).limit(1))
                    c_first = first_cust.scalars().first()
                    if c_first:
                        target_customer_id = c_first.id

        order = Order(
            user_id=user_id,
            customer_id=target_customer_id,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            discount=data.discount_amount,
            tax=tax_amount,
            notes=data.notes
        )

        created_order = await self.repo.create_order(order, db_items)

        # Update Customer total_orders, total_spent, loyalty_points in DB
        if target_customer_id:
            from app.models.all_models import Customer
            cust_to_update = await self.db.get(Customer, target_customer_id)
            if cust_to_update:
                cust_to_update.total_orders = (cust_to_update.total_orders or 0) + 1
                cust_to_update.total_spent = float(cust_to_update.total_spent or 0) + float(total_amount)
                cust_to_update.loyalty_points = (cust_to_update.loyalty_points or 0) + int(total_amount * 0.05)
                await self.db.flush()

        await self.db.commit()
        logger.info(f"Created order ID: {created_order.id} for customer {target_customer_id} for ₹{total_amount}")
        return OrderResponse.model_validate(created_order)

    async def get_order(self, order_id: int) -> OrderResponse:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse.model_validate(order)

    async def get_all_orders(
        self, page: int, per_page: int, status: Optional[OrderStatus]
    ) -> Tuple[List[OrderResponse], int]:
        orders, total = await self.repo.get_all(page, per_page, status)
        return [OrderResponse.model_validate(o) for o in orders], total

    async def update_order_status(self, order_id: int, data: OrderUpdate) -> OrderResponse:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
            
        old_status = order.status
        new_status = data.status
        
        updated = await self.repo.update_status(order_id, new_status, data.notes)
        

        return OrderResponse.model_validate(updated)
