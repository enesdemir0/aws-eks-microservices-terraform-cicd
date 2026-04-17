from fastapi import FastAPI, Depends
from src.utils.auth_verify import get_current_user

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "healthy", "service": "gateway"}

# --- THE TEST ROUTE ---
@app.get("/api/gateway/check-me")
async def gateway_check_me(user: dict = Depends(get_current_user)):
    return {
        "message": "Gateway says: You are authorized!",
        "user_from_node_js": user
    }