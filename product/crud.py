from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from product.model import Product, ProductVariant
from category.model import Category
from product.schemas import ProductCreate, ProductUpdate, ProductVariantCreate, ProductVariantUpdate


def create_product(db: Session, data: ProductCreate, store_id: int):
    product = Product(
        store_id=store_id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        price=data.price,
        stock=data.stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(
    db: Session,
    search: str = None,
    category_id: int = None,
    store_id: int = None,
    min_price: float = None,
    max_price: float = None,
    sort_by: str = "id",
    order: str = "asc",
    skip: int = 0,
    limit: int = 20
):
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.variants),
    ).join(Category, Product.category_id == Category.id)

    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Category.name.ilike(f"%{search}%")
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if store_id:
        query = query.filter(Product.store_id == store_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    sort_columns = {
        "id": Product.id,
        "price": Product.price,
        "name": Product.name,
        "rating": Product.rating,
        "created_at": Product.created_at
    }
    column = sort_columns.get(sort_by, Product.id)

    if order == "desc":
        query = query.order_by(column.desc())
    else:
        query = query.order_by(column.asc())

    return query.offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int):
    product = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.variants),
    ).filter(Product.id == product_id).first()

    if product:
        # Похожие товары по той же категории
        similar = db.query(Product).filter(
            Product.category_id == product.category_id,
            Product.id != product.id
        ).order_by(Product.rating.desc()).limit(4).all()
        product.similar_products = similar

    return product


def update_product(db: Session, product_id: int, data: ProductUpdate):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None
    product.name = data.name
    product.description = data.description
    product.price = data.price
    product.stock = data.stock
    product.category_id = data.category_id
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None
    db.delete(product)
    db.commit()
    return product


# ========== Product Variant CRUD ==========

def create_variant(db: Session, product_id: int, data: ProductVariantCreate):
    variant = ProductVariant(
        product_id=product_id,
        name=data.name,
        variant_type=data.variant_type,
        value=data.value,
        price=data.price,
        stock=data.stock,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


def get_variants(db: Session, product_id: int):
    return db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id
    ).all()


def get_variant(db: Session, variant_id: int):
    return db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()


def update_variant(db: Session, variant_id: int, data: ProductVariantUpdate):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        return None
    if data.name is not None:
        variant.name = data.name
    if data.variant_type is not None:
        variant.variant_type = data.variant_type
    if data.value is not None:
        variant.value = data.value
    if data.price is not None:
        variant.price = data.price
    if data.stock is not None:
        variant.stock = data.stock
    db.commit()
    db.refresh(variant)
    return variant


def delete_variant(db: Session, variant_id: int):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        return None
    db.delete(variant)
    db.commit()
    return variant