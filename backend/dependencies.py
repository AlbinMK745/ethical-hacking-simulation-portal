from fastapi import Header, HTTPException, status

def admin_required(
    user_id: int = Header(...),
    role: str = Header(...)
):
    if role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return {"user_id": user_id, "role": role}
