from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    password: str  # Only used on creation

class UserRead(UserBase):
    id: int
    roles: List[str] = []  # Return role names
    created_at: datetime

    class Config:
        orm_mode = True


class RoleBase(BaseModel):
    name: str

class RoleRead(RoleBase):
    id: int

    class Config:
        orm_mode = True


class AssetBase(BaseModel):
    name: str
    asset_type: str
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    environment: str

class AssetCreate(AssetBase):
    pass

class AssetRead(AssetBase):
    id: int

    class Config:
        orm_mode = True


class EventBase(BaseModel):
    event_type: str
    severity: str
    message: str

class EventCreate(EventBase):
    asset_id: int

class EventRead(EventBase):
    id: int
    timestamp: datetime
    asset: AssetRead

    class Config:
        orm_mode = True


class RawLogBase(BaseModel):
    raw_payload: dict

class RawLogCreate(RawLogBase):
    event_id: int

class RawLogRead(RawLogBase):
    id: int
    ingested_at: datetime
    event: EventRead

    class Config:
        orm_mode = True


class RuleBase(BaseModel):
    name: str
    description: str
    severity: str
    enabled: bool = True

class RuleCreate(RuleBase):
    pass

class RuleRead(RuleBase):
    id: int
    conditions: List["RuleConditionRead"] = []

    class Config:
        orm_mode = True


class RuleConditionBase(BaseModel):
    field: str
    operator: str
    value: str

class RuleConditionCreate(RuleConditionBase):
    rule_id: int

class RuleConditionRead(RuleConditionBase):
    id: int
    rule_id: int

    class Config:
        orm_mode = True


class AlertBase(BaseModel):
    severity: str
    status: str = "open"

class AlertCreate(AlertBase):
    rule_id: int
    event_id: int

class AlertRead(AlertBase):
    id: int
    created_at: datetime
    rule: Optional[RuleRead] = None
    event: Optional["EventRead"] = None

    class Config:
        orm_mode = True


class IncidentBase(BaseModel):
    title: str
    description: str
    status: str = "open"
    severity: str

class IncidentCreate(IncidentBase):
    alert_ids: List[int] = []

class IncidentRead(IncidentBase):
    id: int
    created_at: datetime
    alerts: List[AlertRead] = []

    class Config:
        orm_mode = True


class IncidentAlertBase(BaseModel):
    incident_id: int
    alert_id: int

class IncidentAlertRead(IncidentAlertBase):
    class Config:
        orm_mode = True

class AuditLogBase(BaseModel):
    action: str
    target_type: str
    target_id: Optional[int] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None

class AuditLogRead(AuditLogBase):
    id: int
    user: Optional["UserRead"] = None
    timestamp: datetime

    class Config:
        orm_mode = True


class UserRoleBase(BaseModel):
    user_id: int
    role_id: int

class UserRoleRead(UserRoleBase):
    class Config:
        orm_mode = True


class RawLogReadWithAsset(BaseModel):
    id: int
    raw_payload: dict
    ingested_at: datetime
    event: "EventRead"
    event_asset: "AssetRead"

    class Config:
        orm_mode = True


class IndicatorBase(BaseModel):
    indicator_type: str  # ip, domain, hash
    value: str
    confidence: Optional[int] = None
    source: Optional[str] = None

class IndicatorCreate(IndicatorBase):
    pass

class IndicatorRead(IndicatorBase):
    id: int

    class Config:
        orm_mode = True


class EventIndicatorBase(BaseModel):
    event_id: int
    indicator_id: int

class EventIndicatorRead(EventIndicatorBase):
    class Config:
        orm_mode = True
