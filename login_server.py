from fastapi import FastAPI
from pydantic import BaseModel
import bcrypt
from supabase import create_client

SUPABASE_URL = "https://ytfpiyfapvybihlngxks.supabase.co"
SUPABASE_KEY = "PASTE_YOUR_sb_secret_KEY_HERE"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

class LoginData(BaseModel):
    emp_id: str
    password: str

@app.post("/login")
def login(data: LoginData):

    result = supabase.table("employees")         .select("*")         .eq("emp_id", data.emp_id)         .execute()

    if not result.data:
        return {"success": False}

    employee = result.data[0]

    stored_hash = employee["pass"].encode()

    if bcrypt.checkpw(data.password.encode(), stored_hash):
        return {
            "success": True,
            "employee": employee
        }

    return {"success": False}
