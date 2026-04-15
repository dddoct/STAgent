"""用户管理模块"""
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from .auth import get_password_hash, verify_password

# 数据目录
DATA_DIR = Path(__file__).parent / "data"
USERS_FILE = DATA_DIR / "users.json"


@dataclass
class User:
    id: str
    username: str
    email: str
    hashed_password: str
    created_at: str
    is_active: bool = True


@dataclass
class UserCreate:
    username: str
    email: str
    password: str


def _ensure_data_dir():
    """确保数据目录存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_users() -> Dict[str, dict]:
    """加载用户数据"""
    _ensure_data_dir()
    if not USERS_FILE.exists():
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_users(users: Dict[str, dict]):
    """保存用户数据"""
    _ensure_data_dir()
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def create_user(user_data: UserCreate) -> Optional[User]:
    """创建新用户"""
    users = _load_users()

    # 检查用户名是否已存在
    for user in users.values():
        if user["username"] == user_data.username:
            return None
        if user["email"] == user_data.email:
            return None

    user_id = str(uuid.uuid4())[:8]
    user = User(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        created_at=datetime.now().isoformat(),
        is_active=True
    )

    users[user_id] = asdict(user)
    _save_users(users)

    return user


def authenticate_user(username: str, password: str) -> Optional[User]:
    """验证用户登录"""
    users = _load_users()

    for user_data in users.values():
        if user_data["username"] == username and user_data["is_active"]:
            if verify_password(password, user_data["hashed_password"]):
                return User(**user_data)
            break

    return None


def get_user_by_id(user_id: str) -> Optional[User]:
    """根据ID获取用户"""
    users = _load_users()
    if user_id in users:
        return User(**users[user_id])
    return None


def get_user_by_username(username: str) -> Optional[User]:
    """根据用户名获取用户"""
    users = _load_users()
    for user_data in users.values():
        if user_data["username"] == username:
            return User(**user_data)
    return None
