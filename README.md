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

## facilities
| Facility (common) | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| SYS               | System events (startup, shutdown, configuration)            |
| LINK              | Interface link state changes                                |
| LINEPROTO         | Line protocol changes (interface up/down at protocol layer) |
| SEC               | Security-related logs (ACL, firewall)                       |
| SEC_LOGIN         | Login/authentication events                                 |
| CONFIG            | Configuration change events                                 |
| OSPF              | OSPF routing events                                         |
| BGP               | BGP routing events                                          |
| IP                | IP layer events (routing, packets, etc.)                    |
| PLATFORM          | Hardware/Platform events (power, fans)                      |
| DHCP              | DHCP server/client messages                                 |
| SNMP              | SNMP notifications                                          |
| NTP               | Time sync events                                            |
| AAA               | Authentication, Authorization, Accounting messages          |
| ROUTING           | Generic routing protocol events                             |
| HSRP              | Hot Standby Router Protocol events                          |


## Severity levels
| Severity | Meaning       | Common             |
| -------- | ------------- | ------------------ |
| 0–2      | Emerg/Crit    | Rare               |
| 3        | Errors        | Yes                |
| 4        | Warnings      | Yes                |
| 5        | Notifications | Very common        |
| 6        | Informational | Extremely common   |
| 7        | Debug         | Usually disabled   |

## Mnemonics
| Facility  | Mnemonic Examples                 | Description                                  |
| --------- | --------------------------------- | -------------------------------------------- |
| SYS       | CONFIG_I, RESTART, CPUHOG, MEMORY | Config change, restart, high CPU, low memory |
| LINK      | UPDOWN                            | Interface link status change                 |
| LINEPROTO | UPDOWN                            | Protocol up/down events                      |
| SEC       | IPACCESSLOGP, IPACCESSLOGD        | ACL permit/deny logs                         |
| SEC_LOGIN | LOGIN_FAILED, LOGIN_SUCCESS       | Authentication events                        |
| OSPF      | ADJCHG                            | Neighbor adjacency change                    |
| BGP       | ADJCHANGE                         | BGP neighbor up/down                         |
| PLATFORM  | PWR_FAIL, PWR_OK, FAN_FAIL        | Hardware events                              |
| DHCP      | IP_ASSIGNED, IP_EXPIRED           | DHCP address events                          |
| AAA       | USER_AUTH, AUTH_FAIL              | Authentication/authorization events          |


## RuleCondition Table (example)

### **1. Detect Failed Logins**

| field    | operator | value        |
| -------- | -------- | ------------ |
| log_type | eq       | auth         |
| message  | contains | login failed |
| severity | gte      | 4            |

---

### **3. Detect Configuration Changes**

| field    | operator | value                |
| -------- | -------- | -------------------- |
| log_type | eq       | config               |
| message  | contains | configuration change |
| severity | gte      | 3                    |

---

### **4. Detect Interface Down Events**

| field    | operator | value     |
| -------- | -------- | --------- |
| log_type | eq       | interface |
| message  | contains | down      |
| severity | gte      | 3         |

---

### **5. Detect High-Severity System Errors**

| field    | operator | value |
| -------- | -------- | ----- |
| severity | gte      | 7     |
| log_type | neq      | debug |

---

### **6. Detect Traffic from Specific IPs**

| field    | operator | value                 |
| -------- | -------- | --------------------- |
| src_ip   | in       | 192.168.1.10,10.0.0.5 |
| log_type | eq       | traffic               |

---

### **7. Detect Port Scanning Attempts**

| field    | operator | value   |
| -------- | -------- | ------- |
| log_type | eq       | traffic |
| src_port | lt       | 1024    |
| dst_port | gt       | 1024    |
| message  | contains | scan    |

---

### **8. Detect Denial of Service (DoS)**

| field    | operator | value            |
| -------- | -------- | ---------------- |
| log_type | eq       | traffic          |
| src_ip   | neq      | internal_network |
| message  | contains | flood            |
| severity | gte      | 6                |

---

Feb 06 2026 09:01:05 %SYS-5-CONFIG_I: Configured from console by vty0 (10.1.1.50)
{
  "facility": "SYS",
  "severity": 5,
  "mnemonic": "CONFIG_I",
  "timestamp": "2026-02-06 09:01:05",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "config"
}

Feb 06 2026 09:02:11 %SEC-6-IPACCESSLOGP: list 101 denied tcp 203.0.113.10(44512) -> 192.168.10.5(22), 1 packet
{
  "facility": "SEC",
  "severity": 6,
  "mnemonic": "IPACCESSLOGP",
  "timestamp": "2026-02-06 09:02:11",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "acl_permit"
}

Feb 06 2026 09:03:18 %LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to down
{
  "facility": "LINK",
  "severity": 3,
  "mnemonic": "UPDOWN",
  "timestamp": "2026-02-06 09:03:18",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "interface"
}

Feb 06 2026 09:03:19 %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to down
{
  "facility": "LINEPROTO",
  "severity": 5,
  "mnemonic": "UPDOWN",
  "timestamp": "2026-02-06 09:03:19",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "interface"
}


Feb 06 2026 09:04:42 %LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up
{
  "facility": "LINK",
  "severity": 3,
  "mnemonic": "UPDOWN",
  "timestamp": "2026-02-06 09:04:42",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "interface"
}

Feb 06 2026 09:04:43 %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up
{
  "facility": "LINEPROTO",
  "severity": 5,
  "mnemonic": "UPDOWN",
  "timestamp": "2026-02-06 09:04:43",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "interface"
}

Feb 06 2026 09:05:30 %SYS-5-RESTART: System restarted --
{
  "facility": "SYS",
  "severity": 5,
  "mnemonic": "RESTART",
  "timestamp": "2026-02-06 09:05:30",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "system_restart"
}

Feb 06 2026 09:06:22 %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: admin] [Source: 198.51.100.20] [localport: 22]
{
  "facility": "SEC_LOGIN",
  "severity": 4,
  "mnemonic": "LOGIN_FAILED",
  "timestamp": "2026-02-06 09:06:22",
  "src_ip": "198.51.100.20",
  "src_port": null,
  "dst_ip": null,
  "dst_port": 22,
  "log_type": "auth_fail"
}

Feb 06 2026 09:07:01 %SEC_LOGIN-5-LOGIN_SUCCESS: Login Success [user: admin] [Source: 10.1.1.10] [localport: 22]
{
  "facility": "SEC_LOGIN",
  "severity": 5,
  "mnemonic": "LOGIN_SUCCESS",
  "timestamp": "2026-02-06 09:07:01",
  "src_ip": "10.1.1.10",
  "src_port": null,
  "dst_ip": null,
  "dst_port": 22,
  "log_type": "auth_pass"
}

Feb 06 2026 09:08:44 %OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.2 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down
{
  "facility": "OSPF",
  "severity": 5,
  "mnemonic": "ADJCHG",
  "timestamp": "2026-02-06 09:08:44",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "routing"
}

Feb 06 2026 09:09:12 %OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.2 on GigabitEthernet0/1 from DOWN to FULL, Loading Done
{
  "facility": "OSPF",
  "severity": 5,
  "mnemonic": "ADJCHG",
  "timestamp": "2026-02-06 09:09:12",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "routing"
}

Feb 06 2026 09:10:55 %BGP-5-ADJCHANGE: neighbor 192.0.2.1 Down BGP Notification sent
{
  "facility": "BGP",
  "severity": 5,
  "mnemonic": "ADJCHANGE",
  "timestamp": "2026-02-06 09:10:55",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "routing"
}

Feb 06 2026 09:11:32 %BGP-5-ADJCHANGE: neighbor 192.0.2.1 Up
{
  "facility": "BGP",
  "severity": 5,
  "mnemonic": "ADJCHANGE",
  "timestamp": "2026-02-06 09:11:32",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "routing"
}

Feb 06 2026 09:12:19 %SEC-6-IPACCESSLOGP: list 101 permitted udp 10.10.10.5(5353) -> 224.0.0.251(5353), 1 packet
{
  "facility": "SEC",
  "severity": 6,
  "mnemonic": "IPACCESSLOGP",
  "timestamp": "2026-02-06 09:12:19",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "acl_permit"
}

Feb 06 2026 09:13:47 %SYS-4-CPUHOG: Task ran for 3120 msec (3120/3120), process = IP Input
{
  "facility": "SYS",
  "severity": 4,
  "mnemonic": "CPUHOG",
  "timestamp": "2026-02-06 09:13:47",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "system_cpu"
}

Feb 06 2026 09:14:58 %SYS-3-MEMORY: Low memory condition detected
{
  "facility": "SYS",
  "severity": 3,
  "mnemonic": "MEMORY",
  "timestamp": "2026-02-06 09:14:58",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "system_memory"
}

Feb 06 2026 09:15:33 %PLATFORM-2-PWR_FAIL: Power failure detected on power supply 1
{
  "facility": "PLATFORM",
  "severity": 2,
  "mnemonic": "PWR_FAIL",
  "timestamp": "2026-02-06 09:15:33",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "system_power_fail"
}

Feb 06 2026 09:16:21 %PLATFORM-2-PWR_OK: Power restored on power supply 1
{
  "facility": "PLATFORM",
  "severity": 2,
  "mnemonic": "PWR_OK",
  "timestamp": "2026-02-06 09:16:21",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "system_power_ok"
}

Feb 06 2026 09:17:45 %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: guest] [Source: 203.0.113.99] [localport: 23]
{
  "facility": "SEC_LOGIN",
  "severity": 4,
  "mnemonic": "LOGIN_FAILED",
  "timestamp": "2026-02-06 09:17:45",
  "src_ip": "203.0.113.99",
  "src_port": null,
  "dst_ip": null,
  "dst_port": 23,
  "log_type": "auth_fail"
}

Feb 06 2026 09:18:59 %SYS-5-CONFIG_I: Configured from console by admin (console)
{
  "facility": "SYS",
  "severity": 5,
  "mnemonic": "CONFIG_I",
  "timestamp": "2026-02-06 09:18:59",
  "src_ip": null,
  "src_port": null,
  "dst_ip": null,
  "dst_port": null,
  "log_type": "config"
}
