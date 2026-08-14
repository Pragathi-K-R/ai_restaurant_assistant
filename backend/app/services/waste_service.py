"""
Food Waste Service — Business logic for logging waste and deducting inventory.
Aligned with FoodWaste model columns: quantity_wasted, cost, waste_date,
ingredient_name, unit.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import Tuple, List, Optional
from datetime import date, datetime, timezone
from app.models.all_models import FoodWaste
from app.repositories.waste_repository import WasteRepository
from app.schemas.waste import WasteCreate, WasteUpdate, WasteResponse
import logging

logger = logging.getLogger(__name__)

class WasteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WasteRepository(db)

    def _map_to_response(self, waste: FoodWaste) -> WasteResponse:
        """Map a FoodWaste ORM instance to WasteResponse using model columns."""
        return WasteResponse.model_validate(waste)

    async def log_waste(self, user_id: int, data: WasteCreate) -> WasteResponse:
        cost = 0.0
        ingredient_name = data.ingredient_name
        unit = data.unit

        waste = FoodWaste(
            ingredient_name=ingredient_name,
            quantity_wasted=data.quantity_wasted,
            unit=unit,
            reason=data.reason,
            cost=cost,
            waste_date=data.waste_date or datetime.now(timezone.utc),
        )

        created = await self.repo.create(waste)
        logger.info(f"Logged waste: {data.quantity_wasted} {unit} of {ingredient_name}. Cost: ₹{cost}")
        return self._map_to_response(created)

    async def get_waste(self, waste_id: int) -> WasteResponse:
        waste = await self.repo.get_by_id(waste_id)
        if not waste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")
        return self._map_to_response(waste)

    async def get_all_waste(
        self, page: int, per_page: int, start_date: Optional[date], end_date: Optional[date]
    ) -> Tuple[List[WasteResponse], int]:
        records, total = await self.repo.get_all(page, per_page, start_date, end_date)
        return [self._map_to_response(w) for w in records], total

    async def delete_waste(self, waste_id: int) -> dict:
        waste = await self.repo.get_by_id(waste_id)
        if not waste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")

        await self.repo.delete(waste_id)
        logger.info(f"Deleted waste record ID: {waste_id}")
        return {"message": "Waste record deleted successfully", "success": True}

    async def update_waste(self, waste_id: int, data: WasteCreate) -> WasteResponse:
        waste = await self.repo.get_by_id(waste_id)
        if not waste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")

        waste.ingredient_name = data.ingredient_name
        waste.quantity_wasted = data.quantity_wasted
        waste.unit = data.unit
        waste.reason = data.reason
        if hasattr(data, 'cost') and data.cost is not None:
            waste.cost = data.cost

        if data.waste_date:
            waste.waste_date = data.waste_date

        await self.db.commit()
        await self.db.refresh(waste)
        return self._map_to_response(waste)
