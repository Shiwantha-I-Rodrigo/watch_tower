from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship


Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    # One user → many posts
    posts = relationship("Post", back_populates="user")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    # Foreign key column
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Many posts → one user
    user = relationship("User", back_populates="posts")


# retrieve using foreignkey relationships
# user.posts    --> list of Post objects
# post.user     --> get user object for the post

# passing a foreignkey on create
# user = User(name="Alice")
# post = Post(
#     title="My first post",
#     user=user  # SQLAlchemy sets user_id automatically
# )
# session.add(post)
# session.commit()