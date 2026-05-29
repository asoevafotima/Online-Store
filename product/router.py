from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from product import crud
from product.schemas import (
    ProductCreate, ProductUpdate, ProductRead,
    ProductVariantCreate, ProductVariantUpdate, ProductVariantRead,
)
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/recommendations", response_model=list[ProductRead], summary="Рекомендации на главной")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Персонализированные рекомендации для авторизованного пользователя."""
    from product.recommendations import get_recommendations_for_user
    return get_recommendations_for_user(db, current_user.id)


@router.get("/popular", response_model=list[ProductRead], summary="Популярные товары (для анонима)")
def get_popular(db: Session = Depends(get_db)):
    """Популярные и трендовые товары — без авторизации."""
    from product.recommendations import get_popular_products
    return get_popular_products(db)


@router.get("/", response_model=list[ProductRead])
def get_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    store_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("id", description="id | price | rating | created_at"),
    order: str = Query("asc", description="asc | desc"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return crud.get_products(
        db, search=search, category_id=category_id,
        store_id=store_id, min_price=min_price,
        max_price=max_price, sort_by=sort_by,
        order=order, skip=skip, limit=limit,
    )


@router.get("/{product_id}/similar", response_model=list[ProductRead], summary="Похожие товары")
def get_similar(product_id: int, limit: int = 8, db: Session = Depends(get_db)):
    """
    Похожие товары по алгоритму скоринга:
    категория, магазин, совместные покупки, рейтинг, скидки.
    """
    from product.recommendations import get_similar_products
    return get_similar_products(db, product_id, limit=limit)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product


@router.post("/", response_model=ProductRead)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store:
        raise HTTPException(status_code=404, detail="У вас нет магазина")
    return crud.create_product(db, data, store.id)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store or store.id != product.store_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.update_product(db, product_id, data)


@router.delete("/{product_id}", response_model=ProductRead)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store or store.id != product.store_id:
        if current_user.role not in ["admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Access denied")
    return crud.delete_product(db, product_id)


# ========== Product Variants ==========

@router.get("/{product_id}/variants", response_model=list[ProductVariantRead], summary="Варианты товара")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    """Получить все варианты конкретного товара (размер, цвет и т.д.)."""
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return crud.get_variants(db, product_id)


@router.post("/{product_id}/variants", response_model=ProductVariantRead, summary="Добавить вариант")
def create_product_variant(
    product_id: int,
    data: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Добавить вариант к товару (только владелец магазина)."""
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store or store.id != product.store_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.create_variant(db, product_id, data)


@router.put("/variants/{variant_id}", response_model=ProductVariantRead, summary="Обновить вариант")
def update_product_variant(
    variant_id: int,
    data: ProductVariantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Обновить вариант товара (только владелец магазина)."""
    variant = crud.get_variant(db, variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Вариант не найден")
    product = crud.get_product(db, variant.product_id)
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store or store.id != product.store_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.update_variant(db, variant_id, data)


@router.delete("/variants/{variant_id}", response_model=ProductVariantRead, summary="Удалить вариант")
def delete_product_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Удалить вариант товара (только владелец магазина)."""
    variant = crud.get_variant(db, variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Вариант не найден")
    product = crud.get_product(db, variant.product_id)
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store or store.id != product.store_id:
        if current_user.role not in ["admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Access denied")
    return crud.delete_variant(db, variant_id)