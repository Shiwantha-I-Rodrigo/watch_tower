
# cors preventing cors errors with middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from typing import List
from models_db import Base, User, Role, UserRole, Asset, Event, RawLog, Rule, RuleCondition, Alert, Incident, AuditLog
from models_py import ( 
    UserCreate, UserRead, 
    RoleRead, RoleBase, 
    UserRoleBase, UserRoleRead, 
    AssetCreate, AssetRead, 
    EventCreate, EventRead,
    RawLogCreate, RawLogRead,
    RuleCreate, RuleRead,
    RuleConditionCreate, RuleConditionRead,
    AlertCreate, AlertRead,
    IncidentCreate, IncidentRead,
    AuditLogCreate, AuditLogRead,
    UserRoleBase, UserRoleRead,
    IndicatorCreate, IndicatorRead,
    EventIndicatorBase, EventIndicatorRead,
    )


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


# Users --------------------------------------------------------------------------------------------------------------------
@app.post("/users/", response_model=UserRead)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=user_in.password,  # In real app: hash this!
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[UserRead])
def get_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


# Roles --------------------------------------------------------------------------------------------------------------------
@app.post("/roles/", response_model=RoleRead)
def create_role(role_in: RoleBase, db: Session = Depends(get_db)):
    db_role = Role(
        name=role_in.name
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.get("/roles/", response_model=List[RoleRead])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return roles


# User_Roles --------------------------------------------------------------------------------------------------------------------
@app.post("/user_roles/", response_model=UserRoleRead)
def assign_role(user_role_in: UserRoleBase, db: Session = Depends(get_db)):
    existing = db.query(UserRole).filter_by(
        user_id=user_role_in.user_id, role_id=user_role_in.role_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has this role")
    
    user_role = UserRole(
        user_id=user_role_in.user_id,
        role_id=user_role_in.role_id
    )
    db.add(user_role)
    db.commit()
    db.refresh(user_role)
    return user_role

@app.get("/user_roles/", response_model=List[UserRoleRead])
def get_user_roles(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(UserRole).offset(skip).limit(limit).all()


# Assets --------------------------------------------------------------------------------------------------------------------
@app.post("/assets/", response_model=AssetRead)
def create_asset(asset_in: AssetCreate, db: Session = Depends(get_db)):
    asset = Asset(**asset_in.dict())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@app.get("/assets/", response_model=List[AssetRead])
def get_assets(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    assets = db.query(Asset).offset(skip).limit(limit).all()
    return assets


# Events --------------------------------------------------------------------------------------------------------------------
@app.post("/events/", response_model=EventRead)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).get(event_in.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    event = Event(**event_in.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@app.get("/events/", response_model=List[EventRead])
def get_events(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(Event).offset(skip).limit(limit).all()
    return events


# Logs --------------------------------------------------------------------------------------------------------------------
@app.post("/rawlogs/", response_model=RawLogRead)
def create_rawlog(rawlog_in: RawLogCreate, db: Session = Depends(get_db)):
    event = db.query(Event).get(rawlog_in.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    rawlog = RawLog(**rawlog_in.dict())
    db.add(rawlog)
    db.commit()
    db.refresh(rawlog)
    return rawlog

@app.get("/rawlogs/", response_model=List[RawLogRead])
def get_rawlogs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(RawLog).offset(skip).limit(limit).all()


# Rules --------------------------------------------------------------------------------------------------------------------
@app.post("/rules/", response_model=RuleRead)
def create_rule(rule_in: RuleCreate, db: Session = Depends(get_db)):
    rule = Rule(**rule_in.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@app.get("/rules/", response_model=List[RuleRead])
def get_rules(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Rule).offset(skip).limit(limit).all()

@app.post("/ruleconditions/", response_model=RuleConditionRead)
def create_rule_condition(rc_in: RuleConditionCreate, db: Session = Depends(get_db)):
    rule = db.query(Rule).get(rc_in.rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    condition = RuleCondition(**rc_in.dict())
    db.add(condition)
    db.commit()
    db.refresh(condition)
    return condition

@app.get("/ruleconditions/", response_model=List[RuleConditionRead])
def get_rule_conditions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(RuleCondition).offset(skip).limit(limit).all()


# Alerts --------------------------------------------------------------------------------------------------------------------
@app.post("/alerts/", response_model=AlertRead)
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    rule = db.query(Rule).get(alert_in.rule_id)
    event = db.query(Event).get(alert_in.event_id)
    if not rule or not event:
        raise HTTPException(status_code=404, detail="Rule or Event not found")
    
    alert = Alert(**alert_in.dict())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@app.get("/alerts/", response_model=List[AlertRead])
def get_alerts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Alert).offset(skip).limit(limit).all()


# Incidents --------------------------------------------------------------------------------------------------------------------
@app.post("/incidents/", response_model=IncidentRead)
def create_incident(inc_in: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(
        title=inc_in.title,
        description=inc_in.description,
        status=inc_in.status,
        severity=inc_in.severity
    )
    db.add(incident)
    db.commit()
    
    # Link alerts if any
    for alert_id in inc_in.alert_ids:
        alert = db.query(Alert).get(alert_id)
        if alert:
            incident.alerts.append(alert)
    
    db.commit()
    db.refresh(incident)
    return incident

@app.get("/incidents/", response_model=List[IncidentRead])
def get_incidents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Incident).offset(skip).limit(limit).all()


# Auditlogs --------------------------------------------------------------------------------------------------------------------
@app.post("/auditlogs/", response_model=AuditLogRead)
def create_auditlog(audit_in: AuditLogCreate, db: Session = Depends(get_db)):
    user = None
    if audit_in.user_id:
        user = db.query(User).get(audit_in.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
    audit = AuditLog(**audit_in.dict())
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

@app.get("/auditlogs/", response_model=List[AuditLogRead])
def get_auditlogs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).offset(skip).limit(limit).all()
