
# cors preventing cors errors with middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends, Path
from sqlalchemy import create_engine, event, func, desc, cast, String, Integer
from sqlalchemy.orm import sessionmaker, Session, joinedload
from typing import List
from datetime import datetime, timedelta, timezone
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


# database setup
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


# dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

YEAR = "2026"

# Users --------------------------------------------------------------------------------------------------------------------
@app.post("/users/", response_model=UserRead)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User( username=user_in.username, email=user_in.email, password_hash=user_in.password,)
    if user_in.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_in.role_ids)).all()
        new_user.roles = roles
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[UserRead])
def get_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (db.query(User).order_by(desc(User.id)).offset(skip).limit(limit).all())

@app.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password":
            user.password_hash = value
        elif field != "role_ids":
            setattr(user, field, value)
    if "role_ids" in update_data:
        new_roles = db.query(Role).filter(Role.id.in_(update_data["role_ids"])).all()
        user.roles = new_roles  # SQLAlchemy will remove missing roles
    db.commit()
    db.refresh(user)
    return user

@app.delete("/users/{user_id}", status_code=204)
def delete_user( user_id: int, db: Session = Depends(get_db),):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


# Roles --------------------------------------------------------------------------------------------------------------------
@app.post("/roles/", response_model=RoleRead)
def create_role(role_in: RoleBase, db: Session = Depends(get_db)):
    db_role = Role(name=role_in.name)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.get("/roles/", response_model=List[RoleRead])
def get_roles(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (db.query(Role).order_by(desc(Role.id)).offset(skip).limit(limit).all())

@app.patch("/roles/{role_id}", response_model=RoleRead)
def update_role( role_id: int = Path(..., gt=0), role_in: RoleBase = ..., db: Session = Depends(get_db),):
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db_role.name = role_in.name
    db.commit()
    db.refresh(db_role)
    return db_role

@app.delete("/roles/{role_id}", status_code=204)
def delete_role( role_id: int = Path(..., gt=0), db: Session = Depends(get_db),):
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(db_role)
    db.commit()


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
    return (db.query(Asset).order_by(desc(Asset.id)).offset(skip).limit(limit).all())

@app.patch("/assets/{asset_id}", response_model=AssetRead)
def update_asset( asset_id: int, asset_in: AssetCreate, db: Session = Depends(get_db),):
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
    return (db.query(Event).order_by(desc(Event.id)).offset(skip).limit(limit).all())

@app.patch("/events/{event_id}", response_model=EventRead)
def update_event( event_id: int, event_in: EventUpdate, db: Session = Depends(get_db),):
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


# Logs --------------------------------------------------------------------------------------------------------------------
# this section handles Log ingestion !
# regex patterns
CISCO_CONTEX_PATTERNS = re.compile(r'%([A-Z0-9_]+)-(\d+)-([A-Z0-9_]+):')
CISCO_TIME_PATTERNS = re.compile(r'^(\w+\s+\d+\s+\d+\s+\d+:\d+:\d+)')
CISCO_ID_PATTERNS = {
    "src_ip": [
        re.compile(r'\[Source:\s*(\d{1,3}(?:\.\d{1,3}){3})\]', re.IGNORECASE),
        re.compile(r'from\s+(\d{1,3}(?:\.\d{1,3}){3})', re.IGNORECASE),
        re.compile(r'Src IP:\s*(\d{1,3}(?:\.\d{1,3}){3})', re.IGNORECASE),
    ],
    "dst_ip": [
        re.compile(r'to\s+(\d{1,3}(?:\.\d{1,3}){3})', re.IGNORECASE),
        re.compile(r'Dst IP:\s*(\d{1,3}(?:\.\d{1,3}){3})', re.IGNORECASE),
    ],
    "src_port": [
        re.compile(r'source port\s+(\d+)', re.IGNORECASE),
        re.compile(r'from\s+\d{1,3}(?:\.\d{1,3}){3}\s+port\s+(\d+)', re.IGNORECASE),
    ],
    "dst_port": [
        re.compile(r'\[localport:\s*(\d+)\]', re.IGNORECASE),
        re.compile(r'to\s+\d{1,3}(?:\.\d{1,3}){3}\s+port\s+(\d+)', re.IGNORECASE),
    ],
}

# Mapping (facility, mnemonic) -> log_type
FACILITY_MNEMONIC_LOGTYPE_MAP = {
    ("SYS", "CONFIG_I"): "config",
    ("SYS", "RESTART"): "system_restart",
    ("SYS", "CPUHOG"): "system_cpu",
    ("SYS", "MEMORY"): "system_memory",
    ("LINK", "UPDOWN"): "interface",
    ("LINEPROTO", "UPDOWN"): "interface",
    ("SEC", "IPACCESSLOGP"): "acl_permit",
    ("SEC", "IPACCESSLOGD"): "acl_deny",
    ("SEC_LOGIN", "LOGIN_FAILED"): "auth_fail",
    ("SEC_LOGIN", "LOGIN_SUCCESS"): "auth_pass",
    ("OSPF", "ADJCHG"): "routing",
    ("BGP", "ADJCHANGE"): "routing",
    ("PLATFORM", "PWR_FAIL"): "system_power_fail",
    ("PLATFORM", "PWR_OK"): "system_power_ok",
    ("PLATFORM", "FAN_FAIL"): "system_fan_fail",
    ("DHCP", "IP_ASSIGNED"): "dhcp_assigned",
    ("DHCP", "IP_EXPIRED"): "dhcp_expired",
    ("AAA", "USER_AUTH"): "auth",
    ("AAA", "AUTH_FAIL"): "auth_fail",
}

# parse CISCO type logs into a standard format
def parse_cisco_log(db: Session, log_line, year=None):
    result = {
        "facility": None,
        "severity": None,
        "mnemonic": None,
        "timestamp": None,
        "src_ip": None,
        "src_port": None,
        "dst_ip": None,
        "dst_port": None,
        "log_type" : None,
    }

    # extract facility / severity / mnemonic / logtype
    context_match = CISCO_CONTEX_PATTERNS.search(log_line)
    if context_match:
        result["facility"] = context_match.group(1)
        result["severity"] = int(context_match.group(2))
        result["mnemonic"] = context_match.group(3)
        result["log_type"] = FACILITY_MNEMONIC_LOGTYPE_MAP.get((result["facility"], result["mnemonic"]),"system")

    # extract timestamp
    timestamp_match = CISCO_TIME_PATTERNS.match(log_line)
    if timestamp_match:
        ts_str = timestamp_match.group(1)
        try:
            ts_dt = datetime.strptime(ts_str, "%b %d %Y %H:%M:%S")
            result["timestamp"] = ts_dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            result["timestamp"] = ts_str

    # extract source / destination IP / ports
    for field, regex_list in CISCO_ID_PATTERNS.items():
        for regex in regex_list:
            match = regex.search(log_line)
            if match:
                value = match.group(1)
                result[field] = int(value) if field.endswith("_port") else value
                break
    
    if result.get("src_ip") is None:
        asset = db.query(Asset).order_by(Asset.id.asc()).first()
        if asset and asset.ip_address:
            result["src_ip"] = asset.ip_address

    return result

# helps in matching conditions to incomming logs
def evaluate_condition(field_value, operator, condition_value):
    if field_value is None:
        return False
    try:
        if isinstance(field_value, int):
            condition_value = int(condition_value)
    except ValueError:
        pass
    if operator == "eq":
        return field_value == condition_value
    if operator == "neq":
        return field_value != condition_value
    if operator == "contains":
        return str(condition_value).lower() in str(field_value).lower()
    if operator == "in":
        return field_value in condition_value.split(",")
    if operator == "gt":
        return field_value > condition_value
    if operator == "lt":
        return field_value < condition_value
    if operator == "gte":
        return field_value >= condition_value
    if operator == "lte":
        return field_value <= condition_value

    return False

# match rules(conditions) to incomming logs
def match_rules(parsed_log: dict, rules: list):
    matched_rules = []
    for rule in rules:
        if not rule.enabled:
            continue
        rule_matched = True
        for condition in rule.conditions:
            field = condition.field
            operator = condition.operator
            value = condition.value
            field_value = parsed_log.get(field)
            if not evaluate_condition(field_value, operator, value):
                rule_matched = False
                break
        if rule_matched:
            matched_rules.append(rule)

    return matched_rules

# create event
def auto_event(event_in, db: Session):
    asset = db.query(Asset).get(event_in.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    event = Event(**event_in.dict())
    db.add(event)
    db.commit()
    return event

# create alert
def auto_alert(alert_in, db: Session):
    rule = db.query(Rule).get(alert_in.rule_id)
    event = db.query(Event).get(alert_in.event_id)
    if not rule or not event:
        raise HTTPException(status_code=404, detail="Rule or Event not found")
    alert = Alert(**alert_in.dict())
    db.add(alert)
    db.commit()
    return alert

# create incident
def auto_incident(inc_in, db: Session):
    incident = Incident( title=inc_in.title, description=inc_in.description, status=inc_in.status, severity=inc_in.severity,)
    if inc_in.alert_ids:
        alerts = ( db.query(Alert).filter(Alert.id.in_(inc_in.alert_ids)).all())
        incident.alerts.extend(alerts)
    db.add(incident)
    db.commit()

def detect_event_burst(asset_id: int, event_type: str, db: Session) -> bool:
    window_start = datetime.utcnow() - timedelta(minutes=5)
    event_count = ( db.query(func.count(Event.id)).filter(Event.asset_id == asset_id, Event.event_type == event_type, Event.timestamp >= window_start,).scalar())
    return event_count >= 5

def detect_alert_burst(asset_id: int, event_type: str, db: Session) -> bool:
    window_start = datetime.utcnow() - timedelta(minutes=5)
    alerts = ( db.query(Alert).join(Event).filter( Event.asset_id == asset_id, Event.timestamp >= window_start,).order_by(Event.timestamp.desc()).limit(3).all())
    if len(alerts) < 3:
        return []
    consecutive_alerts = []
    for alert in alerts:
        if alert.event.event_type != event_type:
            break
        consecutive_alerts.append(alert)
    if len(consecutive_alerts) == 3:
        return [a.id for a in consecutive_alerts]
    return []

def get_existing_incident( asset_id: int, event_type: str, db: Session):
    window_start = datetime.utcnow() - timedelta(minutes=60)
    return (db.query(Incident).join(Incident.alerts).join(Alert.event).filter( Incident.status == "open", Event.asset_id == asset_id, Event.event_type == event_type, Incident.created_at >= window_start,).first())

# analyze the incomming log
def analyze_payload(log, db: Session):
    log_line = log["log"]
    parsed_log = parse_cisco_log(db,log_line,YEAR)
    rules = db.query(Rule).options(joinedload(Rule.conditions)).all()
    matched_rules = match_rules(parsed_log, rules)
    if any(matched_rules):
        asset = db.query(Asset).filter(Asset.ip_address == parsed_log["src_ip"]).first()
        event = auto_event(EventCreate(event_type=str(parsed_log["log_type"]), severity=str(parsed_log["severity"]), message=str(f'{matched_rules[0].id}-{matched_rules[0].name}'), asset_id=asset.id),db)
        if parsed_log["severity"] < 7 and detect_event_burst(asset.id, parsed_log["log_type"],db):
            if existing_incident:= get_existing_incident(asset.id, parsed_log["log_type"],db):
                alert = auto_alert(AlertCreate(severity=str(parsed_log["severity"]),status="open",rule_id=matched_rules[0].id,event_id=event.id,),db)
                existing_incident.alerts.append(alert)
                db.commit()
            else:
                if alert_ids := detect_alert_burst(asset.id, parsed_log["log_type"],db):
                    incident = auto_incident(IncidentCreate(title=f"{matched_rules[0].id}-{matched_rules[0].name}",description=matched_rules[0].description,status="open",severity=str(parsed_log["severity"]),alert_ids=alert_ids),db)
                else:
                    alert = auto_alert(AlertCreate(severity=str(parsed_log["severity"]),status="open",rule_id=matched_rules[0].id,event_id=event.id,),db)
        return event.id
    return False

@app.post("/rawlogs/", status_code=201)
async def rawlogs(payload: dict, db: Session = Depends(get_db)):
    event_id = analyze_payload(payload,db)
    if event_id:
        rawlog = RawLog(raw_payload=payload, event_id=event_id)
        db.add(rawlog)
        db.commit()
        return rawlog

@app.get("/rawlogs/", response_model=List[RawLogRead])
def get_rawlogs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (db.query(RawLog).order_by(desc(RawLog.id)).offset(skip).limit(limit).all())

@app.patch("/rawlogs/{rawlog_id}", response_model=RawLogRead)
def update_rawlog( rawlog_id: int, rawlog_in: RawLogUpdate, db: Session = Depends(get_db),):
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
def delete_rawlog( rawlog_id: int, db: Session = Depends(get_db),):
    rawlog = db.query(RawLog).get(rawlog_id)
    if not rawlog:
        raise HTTPException(status_code=404, detail="RawLog not found")
    db.delete(rawlog)
    db.commit()


# Rules --------------------------------------------------------------------------------------------------------------------
@app.post("/rules/", response_model=RuleRead)
def create_rule(rule_in: RuleCreate, db: Session = Depends(get_db)):
    rule = Rule( name=rule_in.name, description=rule_in.description, severity=rule_in.severity, enabled=rule_in.enabled,)
    for cond_in in rule_in.conditions:
        rule.conditions.append(RuleCondition( field=cond_in.field, operator=cond_in.operator, value=cond_in.value,))
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@app.get("/rules/", response_model=List[RuleRead])
def get_rules(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (db.query(Rule).order_by(desc(Rule.id)).offset(skip).limit(limit).all())

@app.patch("/rules/{rule_id}", response_model=RuleRead)
def update_rule( rule_id: int, rule_in: RuleCreate, db: Session = Depends(get_db),):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.name = rule_in.name
    rule.description = rule_in.description
    rule.severity = rule_in.severity
    rule.enabled = rule_in.enabled
    rule.conditions.clear()
    for cond_in in rule_in.conditions:
        rule.conditions.append( RuleCondition( field=cond_in.field, operator=cond_in.operator, value=cond_in.value,))
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
    return (db.query(Alert).order_by(desc(Alert.id)).offset(skip).limit(limit).all())

@app.patch("/alerts/{alert_id}", response_model=AlertRead)
def update_alert( alert_id: int, alert_in: AlertUpdate,db: Session = Depends(get_db),):
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
    incident = Incident(title=inc_in.title, description=inc_in.description, status=inc_in.status, severity=inc_in.severity,)
    if inc_in.alert_ids:
        alerts = (db.query(Alert).filter(Alert.id.in_(inc_in.alert_ids)).all())
        incident.alerts.extend(alerts)
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@app.get("/incidents/", response_model=List[IncidentRead])
def get_incidents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (db.query(Incident).order_by(desc(Incident.id)).offset(skip).limit(limit).all())

@app.patch("/incidents/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: int, inc_in: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    data = inc_in.dict(exclude_unset=True)
    for field, value in data.items():
        if field != "alert_ids":
            setattr(incident, field, value)
    if "alert_ids" in data:
        alert_ids = data["alert_ids"]
        alerts = (db.query(Alert).filter(Alert.id.in_(alert_ids)).all())
        found_ids = {alert.id for alert in alerts}
        missing_ids = set(alert_ids) - found_ids
        if missing_ids:
            raise HTTPException(status_code=400, detail=f"Invalid alert IDs: {sorted(missing_ids)}")
        incident.alerts = alerts
    db.commit()
    db.refresh(incident)
    return incident

@app.delete("/incidents/{incident_id}", status_code=204)
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()


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
    return (db.query(AuditLog).order_by(desc(AuditLog.id)).offset(skip).limit(limit).all())

@app.patch("/auditlogs/{auditlog_id}", response_model=AuditLogRead)
def patch_auditlog( auditlog_id: int, audit_in: AuditLogUpdate, db: Session = Depends(get_db)):
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


# Home --------------------------------------------------------------------------------------------------------------------
@app.get("/events/severity-count", response_model=List[SeverityCount])
def get_event_severity_counts(db: Session = Depends(get_db)):
    return (db.query( Event.severity.label("name"),func.count(Event.id).label("value")).group_by(Event.severity).all())

@app.get("/alerts/severity-count", response_model=List[SeverityCount])
def get_event_severity_counts(db: Session = Depends(get_db)):
    return (db.query( Alert.severity.label("name"),func.count(Alert.id).label("value")).group_by(Alert.severity).all())

def round_time_to_nearest_5min(dt: datetime) -> str:
    return (dt - timedelta(minutes=dt.minute % 5, seconds=dt.second, microseconds=dt.microsecond)).strftime("%H:%M")

@app.get("/events/event-count", response_model=List[EventTrendPoint])
def get_event_trends(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=24)
    minute_bucket = ((cast(func.strftime('%M', Event.timestamp), Integer) // 30) * 30)
    interval = (func.strftime('%Y-%m-%d %H:', Event.timestamp).op("||")(func.printf('%02d', minute_bucket)).op("||")(':00'))
    rows = (db.query(interval.label("time"),func.count().label("events")).filter(Event.timestamp >= cutoff).group_by("time").order_by("time").all())
    counts = {row.time: row.events for row in rows}
    intervals = []
    current = cutoff.replace(second=0, microsecond=0, minute=(cutoff.minute // 30) * 30)
    while current <= now:
        key = current.strftime('%Y-%m-%d %H:%M:%S')
        intervals.append(key)
        current += timedelta(minutes=30)
    result = [EventTrendPoint(time=key, events=counts.get(key, 0))for key in intervals]
    return result

@app.get("/events/source-count", response_model=List[SourceCount])
def get_top_10_assets(db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=1)
    return (db.query(Asset.name.label("source"),func.count(Event.id).label("count"))
    .join(Event, Event.asset_id == Asset.id)
    .filter(Event.timestamp >= since)
    .group_by(Asset.id, Asset.name)
    .order_by(Asset.name.asc())   # or .desc()
    .limit(10)
    .all()
)
