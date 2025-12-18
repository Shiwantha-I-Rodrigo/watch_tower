from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware      # for preventing cors errors with middleware
import sqlite3
import db_get, db_put, db_update, db_delete

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

@app.get("/users/get/{user_id}")
def get_user(user_id: int):
    logs = db_get.get("main.db","users","*",f"WHERE id = {user_id}")
    if logs:
        return logs
    else:
        return "error"

@app.get("/users/delete/{user_id}")
def get_user(user_id: int):
    logs = db_delete.delete("main.db","users",f"id = {user_id}")
    if logs:
        return logs
    else:
        return "success"

class C_User(BaseModel):
    username: str
    password: str

@app.post("/users/create")
async def create_user(user: C_User):
    logs = db_put.put("main.db","users","username,password",f"'{user.username}','{user.password}'")
    if logs:
        return logs
    else:
        return "success"

class U_User(BaseModel):
    id:int
    username: str
    password: str

@app.post("/users/update")
async def create_user(user: U_User):
    logs = db_update.update("main.db","users",f"username='{user.username}',password='{user.password}'",f"id={user.id}")
    if logs:
        return logs
    else:
        return "success"
