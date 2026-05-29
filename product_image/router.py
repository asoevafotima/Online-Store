from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from product_image import crud
from product_image.schemas import ProductImageCreate, ProductImageRead
from dependencies import get_current_user

router = APIRouter(prefix="/product-images", tags=["Product Images"])

@router.post("/", response_model=ProductImageRead)
def add_image(
    data: ProductImageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.add_image(db, data)

@router.get("/{product_id}", response_model=list[ProductImageRead])
def get_images(product_id: int, db: Session = Depends(get_db)):
    return crud.get_product_images(db, product_id)

@router.delete("/{image_id}", response_model=ProductImageRead)
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    image = crud.delete_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Изображение не найдено")
    return image
