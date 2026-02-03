
# cors preventing cors errors with middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends, Path
from sqlalchemy import create_engine, event, func
from sqlalchemy.orm import sessionmaker, Session
from typing import List
from datetime import datetime, timedelta
from models_db import Base, User, Role, UserRole, Asset, Event, RawLog, Rule, RuleCondition, Alert, Incident, AuditLog
from models_py import ( 
    UserCreate, UserRead, UserUpdate,
    RoleRead, RoleBase, 
    UserRoleBase, UserRoleRead, 
    AssetCreate, AssetRead, 
    EventCreate, EventRead, EventUpdate,
    RawLogCreate, RawLogRead, RawLogUpdate,
    RuleCreate, RuleRead,
    RuleConditionCreate, RuleConditionRead,
    AlertCreate, AlertRead, AlertUpdate,
    IncidentCreate, IncidentRead, IncidentUpdate,
    AuditLogCreate, AuditLogRead, AuditLogUpdate,
    UserRoleBase, UserRoleRead,
    IndicatorCreate, IndicatorRead,
    EventIndicatorBase, EventIndicatorRead,
    SeverityCount, EventTrendPoint, SourceCount
    )
import re, operator


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
# Base.metadata.create_all(engine)
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
    
    if user_in.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_in.role_ids)).all()
        new_user.roles = roles
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[UserRead])
def get_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.dict(exclude_unset=True)

    # Update simple fields
    for field, value in update_data.items():
        if field == "password":
            user.password_hash = value  # hash in real app
        elif field != "role_ids":  # skip roles here
            setattr(user, field, value)

    # Update roles if provided
    if "role_ids" in update_data:
        # Query roles from DB
        new_roles = db.query(Role).filter(Role.id.in_(update_data["role_ids"])).all()
        # Replace user's roles with new list
        user.roles = new_roles  # SQLAlchemy handles removal of missing roles

    db.commit()
    db.refresh(user)
    return user

@app.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()


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

@app.patch("/roles/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int = Path(..., gt=0),
    role_in: RoleBase = ...,
    db: Session = Depends(get_db),
):
    db_role = db.query(Role).filter(Role.id == role_id).first()

    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    db_role.name = role_in.name

    db.commit()
    db.refresh(db_role)
    return db_role

@app.delete("/roles/{role_id}", status_code=204)
def delete_role(
    role_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    db_role = db.query(Role).filter(Role.id == role_id).first()

    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(db_role)
    db.commit()


# User_Roles --------------------------------------------------------------------------------------------------------------------
# @app.post("/user_roles/", response_model=UserRoleRead)
# def assign_role(user_role_in: UserRoleBase, db: Session = Depends(get_db)):
#     existing = db.query(UserRole).filter_by(
#         user_id=user_role_in.user_id, role_id=user_role_in.role_id
#     ).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="User already has this role")
    
#     user_role = UserRole(
#         user_id=user_role_in.user_id,
#         role_id=user_role_in.role_id
#     )
#     db.add(user_role)
#     db.commit()
#     db.refresh(user_role)
#     return user_role

# @app.get("/user_roles/", response_model=List[UserRoleRead])
# def get_user_roles(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
#     return db.query(UserRole).offset(skip).limit(limit).all()


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

@app.patch("/assets/{asset_id}", response_model=AssetRead)
def update_asset(
    asset_id: int,
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, value in asset_in.dict().items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset

@app.delete("/assets/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()
    return None


# Events --------------------------------------------------------------------------------------------------------------------
@app.post("/events/", response_model=EventRead)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).get(event_in.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Event not found")

    event = Event(**event_in.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@app.get("/events/", response_model=List[EventRead])
def get_events(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(Event).offset(skip).limit(limit).all()
    return events

@app.patch("/events/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
):
    event = db.query(Event).get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # If asset_id is being updated, validate it
    if event_in.asset_id is not None:
        asset = db.query(Asset).get(event_in.asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

    update_data = event_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event

@app.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return None

# Logs --------------------------------------------------------------------------------------------------------------------

# RAWLOG Format
# {
#   "timestamp": "",
#   "device": { "vendor": "", "hostname": "" },
#   "severity": 0,
#   "message": "",
#   "src": { "ip": "", "port": 0 },
#   "dst": { "ip": "", "port": 0 },
#   "raw": ""
# }

SYSLOG_RE = re.compile(
    r"<(?P<pri>\d+)>"
    r"(?P<ts>\w+\s+\d+\s+\d+:\d+:\d+)\s+"
    r"(?P<host>\S+)\s+"
    r"%(?P<facility>\w+)-(?P<severity>\d+)-(?P<mnemonic>\w+):\s+"
    r"(?P<body>.*)"
)

def parse_syslog_header(raw: str):
    m = SYSLOG_RE.match(raw)
    if not m:
        return {}

    d = m.groupdict()

    return {
        "timestamp": datetime.strptime(d["ts"], "%b %d %H:%M:%S"),
        "hostname": d["host"],
        "severity": int(d["severity"]),
        "facility": d["facility"],
        "mnemonic": d["mnemonic"],
        "body": d["body"]
    }

ACL_RE = re.compile(
    r"(?P<action>permitted|denied)\s+"
    r"(?P<proto>\w+)\s+"
    r"(?P<src_ip>\d+\.\d+\.\d+\.\d+)\((?P<src_port>\d+)\)\s+->\s+"
    r"(?P<dst_ip>\d+\.\d+\.\d+\.\d+)\((?P<dst_port>\d+)\)"
)

def parse_acl(body: str):
    m = ACL_RE.search(body)
    if not m:
        return {}

    d = m.groupdict()
    return {
        "log_type": f"acl_{d['action']}",
        "src": {
            "ip": d["src_ip"],
            "port": int(d["src_port"])
        },
        "dst": {
            "ip": d["dst_ip"],
            "port": int(d["dst_port"])
        }
    }

def classify_log(mnemonic: str):
    if mnemonic.startswith("IPACCESSLOG"):
        return "acl"
    if mnemonic.startswith("SEC_LOGIN"):
        return "auth"
    if mnemonic in ("LINK", "LINEPROTO"):
        return "interface"
    if mnemonic == "CONFIG_I":
        return "config"
    return "system"

def auto_event(event_in):
    asset = db.query(Asset).get(event_in.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Event not found")
    event = Event(**event_in.dict())
    db.add(event)
    db.commit()
    return event

def auto_alert(alert_in):
    rule = db.query(Rule).get(alert_in.rule_id)
    event = db.query(Event).get(alert_in.event_id)
    if not rule or not event:
        raise HTTPException(status_code=404, detail="Rule or Event not found")
    alert = Alert(**alert_in.dict())
    db.add(alert)
    db.commit()
    return alert

def auto_incident(inc_in):
    incident = Incident(
        title=inc_in.title,
        description=inc_in.description,
        status=inc_in.status,
        severity=inc_in.severity,
    )
    if inc_in.alert_ids:
        alerts = (
            db.query(Alert)
            .filter(Alert.id.in_(inc_in.alert_ids))
            .all()
        )
        incident.alerts.extend(alerts)
    db.add(incident)
    db.commit()

from datetime import timedelta
import operator

OPERATORS = {
    "eq": operator.eq,
    "neq": operator.ne,
    "lt": operator.lt,
    "lte": operator.le,
    "gt": operator.gt,
    "gte": operator.ge,
    "contains": lambda a, b: b in a if a else False,
    "startswith": lambda a, b: a.startswith(b) if a else False,
    "endswith": lambda a, b: a.endswith(b) if a else False,
}

def evaluate_condition(
    condition: RuleCondition,
    context: dict,
    db,
    asset_id: int,
) -> bool:
    field = condition.field
    operator_name = condition.operator
    raw_value = condition.value

    # --- THRESHOLD CONDITION ---
    # value format: "<count>|<seconds>"
    if operator_name == "count_gte":
        if field not in context or not context[field]:
            return False

        try:
            threshold, seconds = map(int, raw_value.split("|"))
        except ValueError:
            return False

        window_start = context["timestamp"] - timedelta(seconds=seconds)

        count = (
            db.query(Event)
            .filter(
                Event.asset_id == asset_id,
                Event.event_type == context["event_type"],
                Event.created_at >= window_start,
                Event.message.contains(str(context[field])),
            )
            .count()
        )

        return count >= threshold

    # --- SIMPLE FIELD COMPARISON ---
    field_value = context.get(field)
    if field_value is None:
        return False

    op = OPERATORS.get(operator_name)
    if not op:
        return False

    # type coercion
    if isinstance(field_value, int):
        try:
            raw_value = int(raw_value)
        except ValueError:
            return False

    return op(field_value, raw_value)


def evaluate_rule(rule: Rule, context: dict) -> bool:
    if not rule.enabled:
        return False

    for condition in rule.conditions:
        if not evaluate_condition(condition, context):
            return False

    return True

def analyze_payload(payload: dict):
    raw = payload.get("message", "")

    header = parse_syslog_header(raw)
    if not header:
        return {"raw": raw}

    log_type = classify_log(header["mnemonic"])
    src = {"ip": None}
    dst = {"ip": None}

    # --- AUTH FAILURE NORMALIZATION ---
    if log_type == "auth":
        m = AUTH_FAIL_RE.search(header["body"])
        if m:
            src["ip"] = m.group("src_ip")
            log_type = "auth_failed"

    asset = (
        db.query(Asset)
        .filter(Asset.hostname == header["hostname"])
        .first()
    )
    if not asset:
        return {"raw": raw}

    # --- CREATE EVENT ---
    event = auto_event({
        "event_type": log_type,
        "severity": header["severity"],
        "message": header["body"],
        "asset_id": asset.id,
    })

    # --- BUILD RULE CONTEXT ---
    context = {
        "event_type": log_type,
        "severity": header["severity"],
        "hostname": header["hostname"],
        "src_ip": src["ip"],
        "dst_ip": dst["ip"],
        "timestamp": header["timestamp"],
        "message": header["body"],
    }

    # --- RULE EVALUATION ---
    rules = (
        db.query(Rule)
        .filter(Rule.enabled == True)
        .options(selectinload(Rule.conditions))
        .all()
    )

    for rule in rules:
        matched = True

        for condition in rule.conditions:
            if not evaluate_condition(
                condition=condition,
                context=context,
                db=db,
                asset_id=asset.id,
            ):
                matched = False
                break

        if not matched:
            continue

        alert = auto_alert({
            "severity": rule.severity,
            "status": "open",
            "rule_id": rule.id,
            "event_id": event.id,
        })

        auto_incident({
            "title": rule.name,
            "description": rule.description,
            "status": "open",
            "severity": rule.severity,
            "alert_ids": [alert.id],
        })

    return {
        "timestamp": header["timestamp"].isoformat(),
        "device": {
            "vendor": "Cisco",
            "hostname": header["hostname"],
        },
        "severity": header["severity"],
        "log_type": log_type,
        "src": src,
        "dst": dst,
        "raw": raw,
    }

@app.post("/rawlogs/", status_code=201)
async def rawlogs(payload: dict, db: Session = Depends(get_db)):
    analysis = analyze_payload(payload)
    rawlog = RawLog(raw_payload=analysis, event_id=1)
    db.add(rawlog)
    db.commit()
    return {"status": "ok"}

@app.get("/rawlogs/", response_model=List[RawLogRead])
def get_rawlogs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(RawLog).offset(skip).limit(limit).all()

@app.patch("/rawlogs/{rawlog_id}", response_model=RawLogRead)
def update_rawlog(
    rawlog_id: int,
    rawlog_in: RawLogUpdate,
    db: Session = Depends(get_db),
):
    rawlog = db.query(RawLog).get(rawlog_id)
    if not rawlog:
        raise HTTPException(status_code=404, detail="RawLog not found")

    if rawlog_in.event_id is not None:
        event = db.query(Event).get(rawlog_in.event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        rawlog.event_id = rawlog_in.event_id

    if rawlog_in.raw_payload is not None:
        rawlog.raw_payload = rawlog_in.raw_payload

    db.commit()
    db.refresh(rawlog)
    return rawlog

@app.delete("/rawlogs/{rawlog_id}", status_code=204)
def delete_rawlog(
    rawlog_id: int,
    db: Session = Depends(get_db),
):
    rawlog = db.query(RawLog).get(rawlog_id)
    if not rawlog:
        raise HTTPException(status_code=404, detail="RawLog not found")

    db.delete(rawlog)
    db.commit()


# Rules --------------------------------------------------------------------------------------------------------------------
@app.post("/rules/", response_model=RuleRead)
def create_rule(rule_in: RuleCreate, db: Session = Depends(get_db)):
    rule = Rule(
        name=rule_in.name,
        description=rule_in.description,
        severity=rule_in.severity,
        enabled=rule_in.enabled,
    )

    # Add conditions
    for cond_in in rule_in.conditions:
        rule.conditions.append(
            RuleCondition(
                field=cond_in.field,
                operator=cond_in.operator,
                value=cond_in.value,
            )
        )

    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@app.get("/rules/", response_model=List[RuleRead])
def get_rules(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Rule).offset(skip).limit(limit).all()

@app.patch("/rules/{rule_id}", response_model=RuleRead)
def update_rule(
    rule_id: int,
    rule_in: RuleCreate,
    db: Session = Depends(get_db),
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Update scalar fields
    rule.name = rule_in.name
    rule.description = rule_in.description
    rule.severity = rule_in.severity
    rule.enabled = rule_in.enabled

    # Replace conditions
    rule.conditions.clear()
    for cond_in in rule_in.conditions:
        rule.conditions.append(
            RuleCondition(
                field=cond_in.field,
                operator=cond_in.operator,
                value=cond_in.value,
            )
        )

    db.commit()
    db.refresh(rule)
    return rule

@app.delete("/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return None


# Rule_Conditions --------------------------------------------------------------------------------------------------------------------
# @app.post("/ruleconditions/", response_model=RuleConditionRead)
# def create_rule_condition(rc_in: RuleConditionCreate, db: Session = Depends(get_db)):
#     rule = db.query(Rule).get(rc_in.rule_id)
#     if not rule:
#         raise HTTPException(status_code=404, detail="Rule not found")
    
#     condition = RuleCondition(**rc_in.dict())
#     db.add(condition)
#     db.commit()
#     db.refresh(condition)
#     return condition

# @app.get("/ruleconditions/", response_model=List[RuleConditionRead])
# def get_rule_conditions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
#     return db.query(RuleCondition).offset(skip).limit(limit).all()


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

@app.patch("/alerts/{alert_id}", response_model=AlertRead)
def update_alert(
    alert_id: int,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    for field, value in alert_in.dict(exclude_unset=True).items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert

@app.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()


# Incidents --------------------------------------------------------------------------------------------------------------------
@app.post("/incidents/", response_model=IncidentRead)
def create_incident(inc_in: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(
        title=inc_in.title,
        description=inc_in.description,
        status=inc_in.status,
        severity=inc_in.severity,
    )

    if inc_in.alert_ids:
        alerts = (
            db.query(Alert)
            .filter(Alert.id.in_(inc_in.alert_ids))
            .all()
        )
        incident.alerts.extend(alerts)

    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@app.get("/incidents/", response_model=List[IncidentRead])
def get_incidents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Incident).offset(skip).limit(limit).all()

@app.patch("/incidents/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: int, inc_in: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    data = inc_in.dict(exclude_unset=True)

    # Update scalar fields
    for field, value in data.items():
        if field != "alert_ids":
            setattr(incident, field, value)

    # Validate & replace alerts
    if "alert_ids" in data:
        alert_ids = data["alert_ids"]

        alerts = (
            db.query(Alert)
            .filter(Alert.id.in_(alert_ids))
            .all()
        )

        found_ids = {alert.id for alert in alerts}
        missing_ids = set(alert_ids) - found_ids

        if missing_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid alert IDs: {sorted(missing_ids)}"
            )

        incident.alerts = alerts

    db.commit()
    db.refresh(incident)
    return incident

@app.delete("/incidents/{incident_id}", status_code=204)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    db.delete(incident)
    db.commit()
    return


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

@app.patch("/auditlogs/{auditlog_id}", response_model=AuditLogRead)
def patch_auditlog(
    auditlog_id: int,
    audit_in: AuditLogUpdate,
    db: Session = Depends(get_db)
):
    audit = db.query(AuditLog).get(auditlog_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit log not found")

    # Validate user_id if provided
    if audit_in.user_id is not None:
        user = db.query(User).get(audit_in.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields
    for field, value in audit_in.dict(exclude_unset=True).items():
        setattr(audit, field, value)

    db.commit()
    db.refresh(audit)
    return audit

@app.delete("/auditlogs/{auditlog_id}", status_code=204)
def delete_auditlog(auditlog_id: int, db: Session = Depends(get_db)):
    audit = db.query(AuditLog).get(auditlog_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit log not found")

    db.delete(audit)
    db.commit()
    return


# Home --------------------------------------------------------------------------------------------------------------------
@app.get("/events/severity-count", response_model=List[SeverityCount])
def get_event_severity_counts(db: Session = Depends(get_db)):
    results = (
        db.query(
            Event.severity.label("name"),
            func.count(Event.id).label("value")
        )
        .group_by(Event.severity)
        .all()
    )
    return results

@app.get("/alerts/severity-count", response_model=List[SeverityCount])
def get_event_severity_counts(db: Session = Depends(get_db)):
    results = (
        db.query(
            Alert.severity.label("name"),
            func.count(Alert.id).label("value")
        )
        .group_by(Alert.severity)
        .all()
    )
    return results

def round_time_to_nearest_5min(dt: datetime) -> str:
    rounded = dt - timedelta(minutes=dt.minute % 5,
                             seconds=dt.second,
                             microseconds=dt.microsecond)
    return rounded.strftime("%H:%M")

@app.get("/events/event-count", response_model=List[EventTrendPoint])
def get_event_trends(db: Session = Depends(get_db)):
    events = db.query(Event.timestamp).all()
    counts = {}
    for (ts,) in events:
        interval = round_time_to_nearest_5min(ts)
        counts[interval] = counts.get(interval, 0) + 1
    result = [EventTrendPoint(time=k, events=v) for k, v in sorted(counts.items())]
    return result

@app.get("/events/source-count", response_model=List[SourceCount])
def get_top_10_assets(db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=1)
    results = (
        db.query(
            Asset.name.label("source"),
            func.count(Event.id).label("count")
        )
        .join(Event, Event.asset_id == Asset.id)
        .filter(Event.timestamp >= since)
        .group_by(Asset.id)
        .order_by(func.count(Event.id).desc())
        .limit(10)
        .all()
    )
    return results
