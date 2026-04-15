"""认证相关 API 路由"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from backend.auth import create_access_token, get_current_user
from backend.users import create_user, authenticate_user, UserCreate

router = APIRouter(prefix="/api/auth", tags=["认证"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str


@router.post("/register", response_model=UserResponse)
async def register(data: RegisterRequest):
    """用户注册"""
    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码长度至少6位"
        )

    user = create_user(UserCreate(
        username=data.username,
        email=data.email,
        password=data.password
    ))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在"
        )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """用户登录"""
    user = authenticate_user(data.username, data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 创建访问令牌
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username}
    )

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    from ..users import get_user_by_id
    user = get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at
    )


@router.post("/logout")
async def logout():
    """用户登出（前端清除 token 即可）"""
    return {"message": "登出成功"}
