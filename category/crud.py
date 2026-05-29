from sqlalchemy.orm import Session
from category.model import Category
from category.schemas import CategoryCreate, CategoryUpdate

def create_category(db: Session, data: CategoryCreate):
    category = Category(
        name=data.name,
        description=data.description,
        parent_id=data.parent_id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def get_categories(db: Session):
    return db.query(Category).all()

def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()

def update_category(db: Session, category_id: int, data: CategoryUpdate):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return None
    category.name = data.name
    category.description = data.description
    db.commit()
    db.refresh(category)
    return category

def delete_category(db: Session, category_id: int):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return None
    db.delete(category)
    db.commit()
    return category
