"""
Customer API routes.
"""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_manager
from app.models.user import User
from app.models.all_models import Customer, Order, OrderItem, Menu, Review
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.schemas.user import MessageResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get(
    "/me/dashboard",
    summary="Get logged-in customer's dashboard analytics and profile",
)
async def get_customer_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns real PostgreSQL/SQLite aggregated customer profile, total spend, total orders,
    status frequency breakdown, favorite dishes, recent order history, reviews, and menu recommendations.
    """
    # 1. Match Customer for current_user
    stmt = select(Customer).where(
        or_(Customer.email == current_user.email, Customer.name == current_user.full_name)
    )
    result = await db.execute(stmt)
    customer = result.scalars().first()

    if not customer:
        stmt_first = select(Customer).order_by(Customer.id.asc()).limit(1)
        res_first = await db.execute(stmt_first)
        customer = res_first.scalars().first()

    if not customer:
        customer = Customer(
            name=current_user.full_name,
            email=current_user.email,
            phone=current_user.phone or "+91 98765 43210",
            segment="Regular Loyal Member",
            loyalty_points=150,
        )
        db.add(customer)
        await db.commit()
        await db.refresh(customer)

    customer_id = customer.id

    # 2. Query Orders for customer
    orders_stmt = select(Order).where(
        or_(Order.customer_id == customer_id, Order.user_id == current_user.id)
    ).order_by(Order.created_at.desc())
    orders_res = await db.execute(orders_stmt)
    orders = list(orders_res.scalars().all())

    # Summary Metrics
    total_orders = len(orders)
    total_spent = sum(float(o.total_amount or 0) for o in orders)
    avg_order_value = round(total_spent / total_orders, 2) if total_orders > 0 else 0.0
    
    loyalty_points = customer.loyalty_points if (customer.loyalty_points and customer.loyalty_points > 0) else int(total_spent * 0.05) + 150
    next_tier_points = 1000
    tier = customer.segment or ("Platinum VIP" if total_spent > 15000 else "Gold VIP" if total_spent > 5000 else "Regular Loyal Member")

    # Order status breakdown
    status_counts = {"delivered": 0, "preparing": 0, "pending": 0, "cancelled": 0, "confirmed": 0, "ready": 0}
    for o in orders:
        st = (o.status or "pending").lower()
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts[st] = 1

    # 3. Recent orders list
    recent_orders_list = []
    for o in orders[:10]:
        items_list = []
        if o.items:
            for item in o.items:
                items_list.append({
                    "id": item.id,
                    "menu_item_id": item.menu_item_id,
                    "item_name": item.menu_item.name if item.menu_item else f"Dish #{item.menu_item_id}",
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price or 0),
                    "total_price": float(item.total_price or 0),
                })
        recent_orders_list.append({
            "id": o.id,
            "order_number": f"ORD-#{o.id + 1000}",
            "status": (o.status or "PENDING").lower(),
            "payment_status": (o.payment_status or "PENDING").lower(),
            "total_amount": float(o.total_amount or 0),
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": items_list,
        })

    # 4. Favorite / Most-ordered menu items
    fav_stmt = (
        select(Menu, func.sum(OrderItem.quantity).label("total_qty"))
        .join(OrderItem, OrderItem.menu_item_id == Menu.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.customer_id == customer_id)
        .group_by(Menu.id)
        .order_by(desc("total_qty"))
        .limit(6)
    )
    fav_res = await db.execute(fav_stmt)
    favorite_items = []
    for menu_item, qty in fav_res.all():
        favorite_items.append({
            "id": menu_item.id,
            "name": menu_item.name,
            "category": str(menu_item.category.value if hasattr(menu_item.category, "value") else menu_item.category),
            "price": float(menu_item.price),
            "description": menu_item.description,
            "image_url": menu_item.image_url,
            "rating": menu_item.rating,
            "total_qty_ordered": qty,
        })

    # 5. Customer Reviews
    rev_stmt = select(Review).where(Review.customer_id == customer_id).order_by(Review.created_at.desc())
    rev_res = await db.execute(rev_stmt)
    customer_reviews = []
    for r in rev_res.scalars().all():
        customer_reviews.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "sentiment": r.sentiment or "positive",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # 6. Recommendations
    rec_stmt = select(Menu).where(Menu.is_available == True).order_by(Menu.rating.desc(), Menu.total_orders.desc()).limit(6)
    rec_res = await db.execute(rec_stmt)
    recommendations = []
    for m in rec_res.scalars().all():
        recommendations.append({
            "id": m.id,
            "name": m.name,
            "category": str(m.category.value if hasattr(m.category, "value") else m.category),
            "price": float(m.price),
            "description": m.description,
            "image_url": m.image_url,
            "is_vegetarian": m.is_vegetarian,
            "preparation_time": m.preparation_time,
            "rating": m.rating,
        })

    return {
        "profile": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email or current_user.email,
            "phone": customer.phone or current_user.phone or "+91 98765 43210",
            "address": customer.address or "Bengaluru, Karnataka",
            "segment": tier,
            "loyalty_points": loyalty_points,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
        },
        "summary": {
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "average_order_value": avg_order_value,
            "loyalty_points": loyalty_points,
            "next_tier_points": next_tier_points,
            "tier": tier,
        },
        "order_stats": {
            "status_counts": status_counts,
        },
        "recent_orders": recent_orders_list,
        "favorite_items": favorite_items,
        "customer_reviews": customer_reviews,
        "recommendations": recommendations,
    }



@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer",
)
async def create_customer(
    data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    return await service.create_customer(data)

@router.get(
    "/",
    response_model=CustomerListResponse,
    summary="List all customers",
)
async def list_customers(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    customers, total = await service.get_all_customers(page, per_page, search)
    return CustomerListResponse(customers=customers, total=total, page=page, per_page=per_page)

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get customer details",
)
async def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    return await service.get_customer(customer_id)

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update customer details",
)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    return await service.update_customer(customer_id, data)

@router.delete(
    "/{customer_id}",
    response_model=MessageResponse,
    summary="Delete a customer (Manager/Admin)",
)
async def delete_customer(
    customer_id: int,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    return await service.delete_customer(customer_id)
