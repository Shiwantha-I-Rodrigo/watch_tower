from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    age: int


class UserRead(BaseModel):
    id: int
    name: str
    age: int

    class Config:
        orm_mode = True  # Allows reading from SQLAlchemy objects


class PostCreate(BaseModel):
    title: str
    user_id: int


class PostRead(BaseModel):
    id: int
    title: str
    user_id: int

    class Config:
        orm_mode = True  # Allows reading from SQLAlchemy objects
