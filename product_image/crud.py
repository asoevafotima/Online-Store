from sqlalchemy.orm import Session
from product_image.model import ProductImage
from product_image.schemas import ProductImageCreate

def add_image(db: Session, data: ProductImageCreate):
    image = ProductImage(
        product_id=data.product_id,
        image_url=data.image_url
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def get_product_images(db: Session, product_id: int):
    return db.query(ProductImage).filter(ProductImage.product_id == product_id).all()

def delete_image(db: Session, image_id: int):
    image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not image:
        return None
    db.delete(image)
    db.commit()
    return image
