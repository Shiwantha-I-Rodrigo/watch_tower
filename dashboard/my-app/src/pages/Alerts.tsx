import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function AlertManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<AlertForm | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    type RuleCondition = {
        id: number;
        rule_id: number;
        field: string;
        operator: string;
        value: string;
    };

    type Rule = {
        id: number;
        name: string;
        description: string;
        severity: string;
        enabled: boolean;
        conditions: RuleCondition[];
    };

    type Asset = {
        id: number;
        name: string;
        asset_type: string;
        ip_address: string;
        hostname: string;
        environment: string;
    };

    type Event = {
        id: number;
        event_type: string;
        severity: string;
        message: string;
        timestamp: string;
        asset: Asset;
    };

    type Alert = {
        id: number;
        severity: string;
        status: string;
        created_at: string;
        rule?: Rule | null;
        event?: Event | null;
    };

    type AlertForm = {
        id?: number;
        severity: string;
        status: string;
        event_id: number | null;
        rule_id: number | null;
    };

    // fetch alerts
    const fetchAlerts = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/alerts/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch alerts");
            const data: Alert[] = await res.json();
            setAlerts(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching alerts: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchAlerts(0);
    }, [fetchAlerts]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchAlerts(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchAlerts(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, alert: Alert) => {
        e.preventDefault()
        setSelectedAlert({
            id: alert.id,
            severity: alert.severity,
            status: alert.status,
            event_id: alert.event?.id ?? null,
            rule_id: alert.rule?.id ?? null,
        })
        setSelectedEvent(alert.event ?? null)
        setSelectedRule(alert.rule ?? null)
    }

    // handle new form
    const handleNew = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setSelectedAlert({
            id: undefined,
            severity: "",
            status: "",
            event_id: null,
            rule_id: null
        });
        setSelectedEvent(null);
        setSelectedRule(null);
    }

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        e.preventDefault()
        if (!selectedAlert) return
        const { name, value, type } = e.target
        const parsed = type === "number" ? value === "" ? null : Number(value) : value
        setSelectedAlert(prev => ({ ...prev!, [name]: parsed, }))
        console.log(selectedAlert)
    }

    // create alert
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAlert) return;
        if (!window.confirm("Are you sure you want to create this alert?")) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/alerts/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAlert),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `alert`, created.id, 1)
            toast.success(`Alert created successfully! ID: ${created.id}`);
            setSelectedAlert(null);
        } catch (err: any) {
            toast.error(`Error creating alert: ${err.message}`);
        }
    }

    // update alert
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAlert?.id) return;
        if (!window.confirm("Are you sure you want to update this alert?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/alerts/${selectedAlert.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAlert),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `alert`, updated.id, 1)
            toast.success(`Alert updated successfully! ID: ${selectedAlert.id}`);
            setAlerts(prev => prev.map(alert => (alert.id === updated.id ? updated : alert)));
            setSelectedAlert(null);
        } catch (err: any) {
            toast.error(`Error updating alert: ${err.message}`);
        }
    }

    // delete alert
    async function handleDelete(alertId: number) {
        if (alertId <= 0) return
        if (!window.confirm("Are you sure you want to delete this alert?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/alerts/${alertId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `alert`, alertId, 1)
            toast.success(`Alert deleted successfully! ID: ${alertId}`);
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        } catch (err: any) {
            toast.error(`Error deleting alert: ${err.message}`);
        }
    }

    // create audit log
    const handleLog = (action: string, target_type: string, target_id: number, user_id: number) => {
        const payload = {
            action: action,
            target_type: target_type,
            target_id: target_id,
            user_id: user_id
        };
        fetch("http://127.0.0.1:8000/auditlogs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    };

    return (
        <div className="row content g-4">
            <div className="col-12 d-flex justify-content-start">
                <h2>User Management</h2>
            </div>

            <div className={selectedAlert ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">System Users</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        {/*TABLE*/}
                        <table cellPadding="1" className="w-100">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Status</th>
                                    <th>Severity</th>
                                    <th>Created At</th>
                                    <th>Event</th>
                                    <th>Rule</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(alert => (
                                    <tr key={alert.id}>
                                        <td>{alert.id}</td>
                                        <td>{alert.status}</td>
                                        <td>{alert.severity}</td>
                                        <td>{new Date(alert.created_at).toLocaleString()}</td>
                                        <td>
                                            {alert.event ? (
                                                <>
                                                    <div><strong>{alert.event.event_type}</strong></div>
                                                    <div className="text-muted small">
                                                        {alert.event.message.slice(0, 40)}…
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            {alert.rule ? (
                                                <>
                                                    <div><strong>{alert.rule.name}</strong></div>
                                                    <div className="text-muted small">
                                                        Severity: {alert.rule.severity}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <button onClick={(e) => handleModify(e, alert)}><i className="bi bi-pencil-square"></i></button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDelete(alert.id)}><i className="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="card-body row justify-content-center">
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={page === 0} onClick={() => handlePrev()}>Previous</button>
                        </div>
                        <div className="col-3">
                            <button className="btn btn-success w-100" onClick={(e) => handleNew(e)}>Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedAlert && (
                <div className="col-md-12 col-lg-6">
                    <div className="card h-100">
                        <h5 className="card-title card_title">{selectedAlert.id ? "Modify Alert" : "Add New Alert"}</h5>
                        <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid" />
                        <div className="card-body">

                            <form onSubmit={selectedAlert.id ? handleUpdate : handleCreate}>

                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Severity:</label>
                                    </div>
                                    <div className="col-8">
                                        <select
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="severity"
                                        value={selectedAlert.severity}
                                        onChange={handleChange}
                                        required>
                                            <option value="" disabled>-- Select Severity --</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Status:</label>
                                    </div>
                                    <div className="col-8">
                                        <select
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="status"
                                        value={selectedAlert.status}
                                        onChange={handleChange}
                                        required>
                                            <option value="" disabled>-- Select Status --</option>
                                            <option value="open">Open</option>
                                            <option value="acknowledged">Acknowledged</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Event ID:</label>
                                    </div>
                                    <div className="col-8">

                                        <input
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
                                            name="event_id"
                                            value={selectedAlert?.event_id ?? ""}
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            onChange={handleChange}
                                            required
                                        />

                                        {selectedAlert.id && (
                                            <textarea
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="event"
                                                rows={10}
                                                value={selectedEvent ? `ID: ${selectedEvent.id}\nName: ${selectedEvent.event_type}\nSeverity: ${selectedEvent.severity}\nMessage: ${selectedEvent.message}\nTimeStamp: ${selectedEvent.timestamp}\nHost: ${selectedEvent.asset.name}\n${selectedEvent.asset.ip_address}` : "N/A"}
                                                readOnly/>
                                        )}

                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-4">
                                        <label>Rule ID:</label>
                                    </div>
                                    <div className="col-8">

                                        <input
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
                                            name="rule_id"
                                            value={selectedAlert?.rule_id ?? ""}
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            onChange={handleChange}
                                            required
                                        />
                                    
                                        {selectedAlert.id && (
                                            <textarea
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
                                            readOnly
                                            name="rule"
                                            rows={10}
                                            value={selectedRule ? `ID: ${selectedRule.id}\nName: ${selectedRule.name}\nSeverity: ${selectedRule.severity}\nEnabled: ${selectedRule.enabled}\nDescription: ${selectedRule.description}` : "N/A"}/>
                                        )}

                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-6">
                                    </div>
                                    <div className="col-3">
                                        <button type="submit" className="btn btn-success w-100">{selectedAlert.id ? "Save" : "Create"}</button>
                                    </div>
                                    <div className="col-3">
                                        <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedAlert(null)}>Cancel</button>
                                    </div>
                                </div>

                            </form>

                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    )
}

export default AlertManagement;