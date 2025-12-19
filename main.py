
# cors preventing cors errors with middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from models_db import Base, User, Post
from models_py import UserCreate, UserRead, PostCreate, PostRead


# Create FastAPI app
app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database setup
# full_path : sqlite:////full/path/to/app.db | subfolder : sqlite:///./data/app.db | same folder : sqlite:///example.db
engine = create_engine("sqlite:///./db/main.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)
# auto enable foreign key constraints on sqlite | since sqlite diables foreing key constraints by default for each new connection
@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# create a user
@app.post("/users/", response_model=UserRead)
def create_user(user: UserCreate):
    db = next(get_db())
    db_user = User(name=user.name, age=user.age)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# list all users
@app.get("/users/", response_model=list[UserRead])
def list_users():
    db = next(get_db())
    users = db.query(User).all()
    return users


# create a post
@app.post("/posts/", response_model=PostRead)
def create_post(post: PostCreate):
    db = next(get_db())
    db_post = Post(title=post.title, user_id=post.user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


# list all posts
@app.get("/posts/", response_model=list[PostRead])
def list_posts():
    db = next(get_db())
    posts = db.query(Post).all()
    return posts