from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

subscriptions = {}  # In-memory store for subscriptions

@router.post("/subscribe/{user_id}/{basket_id}")
async def subscribe(user_id: str, basket_id: str):
    if user_id not in subscriptions:
        subscriptions[user_id] = set()
    subscriptions[user_id].add(basket_id)
    return {"message": "Subscribed successfully!", "basket_id": basket_id}

@router.delete("/unsubscribe/{user_id}/{basket_id}")
async def unsubscribe(user_id: str, basket_id: str):
    if user_id in subscriptions and basket_id in subscriptions[user_id]:
        subscriptions[user_id].remove(basket_id)
        return {"message": "Unsubscribed successfully!", "basket_id": basket_id}
    raise HTTPException(status_code=404, detail="Subscription not found.")

@router.get("/subscriptions/{user_id}", response_model=List[str])
async def list_subscriptions(user_id: str):
    return list(subscriptions.get(user_id, []))

