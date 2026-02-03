# SETUP

## FastAPI (backend)

Python Virtual Environment

```
$ python -m venv env
$ source env/bin/activate
```

Configure PIP

```
$ python -m ensurepip --upgrade
$ python -m pip install --upgrade pip
```

Install FastAPI

```
$ pip install "fastapi[standard]"
```

Run FastAPI server

```
$ fastapi dev main.py
```

### Log Ingestion
---

```
Router/Switch (TCP/UDP) → syslog → backend fastAPI endpoint (HTTP)
```

Install a syslog server (rsyslog/syslog-ng/etc...)

```
$ yay -S rsyslog
```

Configuration

1. create /etc/rsyslog.d/10-cisco.conf

```
module(load="imudp")
input(type="imudp" port="514")

module(load="imtcp")
input(type="imtcp" port="514")
```

restart syslog

```        
$ systemctl restart rsyslog
```
test syslog

```
ss -lunpt | grep 514
```

2. create /etc/rsyslog.d/30-cisco.conf

```
##############################
# Cisco IOS SIEM Processing  #
##############################

##########
# Template
##########

template(name="cisco_json" type="list") {
    constant(value="{")
        constant(value="\"timestamp\":\"")
            property(name="timereported" dateFormat="rfc3339")
        constant(value="\",\"hostname\":\"")
            property(name="hostname")
        constant(value="\",\"source_ip\":\"")
            property(name="fromhost-ip")
        constant(value="\",\"severity\":\"")
            property(name="syslogseverity-text")
        constant(value="\",\"facility\":\"")
            property(name="syslogfacility-text")
        constant(value="\",\"program\":\"")
            property(name="programname")
        constant(value="\",\"message\":\"")
            property(name="msg" format="json")
    constant(value="\"}")
}

########################
# Cisco Log Processing
########################

# Match remote logs only
# Cisco devices typically use local7, but we allow all remote sources
if ($fromhost-ip != "127.0.0.1") then {

    #################
    # Local log file
    #################
    action(
        type="omfile"
        file="/var/log/cisco.log"
        createDirs="on"
    )

    #########################
    # Forward to SIEM (HTTP)
    #########################
    action(
        type="omhttp"
        server="siem.example.com"
        serverport="443"
        usehttps="on"
        restpath="/ingest/syslog"
        template="cisco_json"
        httpheaders=["Content-Type: application/json"]

        # Queue for Reliability / performance
        queue.type="LinkedList"
        queue.size="100000"
        queue.dequeueBatchSize="100"
        action.resumeRetryCount="-1"
        action.reportSuspension="on"
        action.reportSuspensionContinuation="on"
    )

    # Stop further processing to avoid duplicates
    stop
}
```

> !!! why 30? rsyslog loads config files in lexical order. Listeners (early) ie 10, routing rule (middle) ie 30.

enable rsyslog (do not start manually) and restart pc.
```
# systemctl enable rsyslog.service
```

```
logger -n 127.0.0.1 -P 514 -d "%LINK-3-UPDOWN: Interface Gi0/1, changed state to down"
logger -n 127.0.0.1 -P 514 -T "%LINK-3-UPDOWN: Interface Gi0/1, changed state to down"
tail -f /var/log/cisco.log
```

## REACT (frontend)

Install NVM

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
$ source ~/.bashrc
$ nvm install --lts
$ nvm ls
```

Install Vite

```
$ npm install -D vite
```

Create React App Template

```
$ npm create vite@latest my-app -- --template react-ts
```

Run Vite Server

```
$ npx vite
```

Run Dev Server

```
$ npm run dev
```

---

## Rawlog Format
```
{
    "timestamp": "",
    "device": { "vendor": "", "hostname": "" },
    "severity": 0,
    "message": "",
    "src": { "ip": "", "port": 0 },
    "dst": { "ip": "", "port": 0 },
    "raw": ""
}
```

## Expected Syslogs Format
```
<PRI>MMM DD HH:MM:SS HOSTNAME %FACILITY-SEVERITY-MNEMONIC: message
```

## Cisco IOS Log Types
| Log Type                        | Facility / Mnemonic Examples                                  | Devices            | What It Means                        | SIEM Value | Key Fields to Extract    |
| ------------------------------- | ------------------------------------------------------------- | ------------------ | ------------------------------------ | ---------- | ------------------------ |
| **Authentication / Login**      | `SEC_LOGIN-5-LOGIN_SUCCESS`<br>`SEC_LOGIN-4-LOGIN_FAILED`     | 1800 / 2960 / 3750 | Admin login success/failure          | ⭐⭐⭐⭐⭐ | user, src_ip, result     |
| **Configuration Changes**       | `SYS-5-CONFIG_I`                                              | 1800 / 2960 / 3750 | Device configuration modified        | ⭐⭐⭐⭐⭐ | user, src_ip, method     |
| **System Reload / Boot**        | `SYS-5-RELOAD`                                                | 1800 / 2960 / 3750 | Device reboot                        | ⭐⭐⭐⭐⭐ | reason                   |
| **Port Security Violation**     | `PORT_SECURITY-2-PSECURE_VIOLATION`                           | 2960 / 3750        | MAC violation on access port         | ⭐⭐⭐⭐⭐ | interface, mac           |
| **ACL Deny**                    | `SEC-6-IPACCESSLOGDP`                                         | 1800 / 3750        | Traffic denied by ACL                | ⭐⭐⭐⭐⭐ | src/dst IP, ports, proto |
| **ACL Permit**                  | `SEC-6-IPACCESSLOGP`                                          | 1800 / 3750        | Traffic permitted by ACL             | ⭐⭐⭐⭐   | src/dst IP, ports, proto |
| **Interface Up/Down**           | `LINK-3-UPDOWN`<br>`LINEPROTO-5-UPDOWN`                       | 1800 / 2960 / 3750 | Physical or logical interface change | ⭐⭐⭐⭐   | interface, state         |
| **CPU / Resource Warnings**     | `SYS-3-CPUHOG`                                                | 1800 / 3750        | CPU starvation                       | ⭐⭐⭐⭐   | process, duration        |
| **Routing Adjacency**           | `OSPF-5-ADJCHG`<br>`EIGRP-5-NEIGHBOR_UP`<br>`BGP-5-ADJCHANGE` | 1800 / 3750        | Routing neighbor state change        | ⭐⭐⭐⭐   | neighbor_ip, protocol    |
| **ARP / IP Conflicts**          | `IP-4-DUPADDR`                                                | 1800 / 3750        | Duplicate IP detected                | ⭐⭐⭐⭐   | ip, interface            |
| **Spanning Tree (STP)**         | `SPANTREE-2-RECV_PVID_ERR`<br>`SPANTREE-5-PORTFAST`           | 2960 / 3750        | STP events / loop indicators         | ⭐⭐⭐     | vlan, interface          |
| **Switch Stack / EtherChannel** | `SW_STACK-6-STACK_MEMBER_ADDED`<br>`EC-5-CANNOT_BUNDLE2`      | 3750               | Stack or port-channel issues         | ⭐⭐⭐     | member, interface        |
| **Environmental (limited)**     | `PLATFORM-1-FAULT`                                            | 3750               | Hardware/platform fault              | ⭐⭐⭐     | component                |
| **DHCP Snooping**               | `DHCP_SNOOPING-5-DHCP_SNOOPING_ENABLED`                       | 2960 / 3750        | DHCP snooping events                 | ⭐⭐⭐     | vlan, interface          |

## Severity levels
| Severity | Meaning       | Common             |
| -------- | ------------- | ------------------ |
| 0–2      | Emerg/Crit    | Rare               |
| 3        | Errors        | Yes                |
| 4        | Warnings      | Yes                |
| 5        | Notifications | Very common        |
| 6        | Informational | Extremely common   |
| 7        | Debug         | Usually disabled   |

## RuleCondition Table (example)
| field      | operator | value        |
| ---------- | -------- | ------------ |
| event_type | eq       | auth_failed  |
| src_ip     | neq      | 127.0.0.1    |
| message    | contains | Login failed |
