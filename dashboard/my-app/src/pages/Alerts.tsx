import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function AlertManagement() {
    const [page, setPage] = useState(0);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [hasMore, setHasMore] = useState(true);
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
    useEffect(() => {
        fetch("http://127.0.0.1:8000/alerts/?skip=0&limit=10")
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch alerts");
                }
                return res.json();
            })
            .then((data: Alert[]) => {
                setAlerts(data);
                setHasMore(data.length === 10);
            })
            .catch(err => {
                console.error("Error fetching alerts:", err);
                toast.error("Error fetching alerts");
            });
    }, []);

    // handle modify
    function handleModifyAlert(alert: Alert) {
        setSelectedAlert({
            id: alert.id,
            severity: alert.severity,
            status: alert.status,
            event_id: alert.event?.id ?? null,
            rule_id: alert.rule?.id ?? null,
        });
        setSelectedEvent(alert.event ?? null);
        setSelectedRule(alert.rule ?? null);
    }

    // handle new
    function handleNewAlert() {
        setSelectedAlert({ id: undefined, severity: "", status: "", event_id: null, rule_id: null });
        setSelectedEvent(null);
        setSelectedRule(null);
    }

    // handle change
    function handleAlertChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
        if (!selectedAlert) return;

        const { name, value } = e.target;

        setSelectedAlert(prev => ({
            ...prev!,
            [name]:
                name === "event_id" || name === "rule_id"
                    ? value === "" ? null : Number(value)
                    : value,
        }));
    }

    // create alert
    async function handleCreateAlert(e: React.FormEvent) {
        e.preventDefault();

        try {
            const response = await fetch("http://127.0.0.1:8000/alerts/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAlert),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create alert");
            }

            const createdAlert = await response.json();
            toast.success(`Alert created successfully! ID: ${createdAlert.id}`);

            // close the form
            setSelectedAlert(null);

        } catch (err: any) {
            console.error(err);
            toast.error(`Error creating alert: ${err.message}`);
        }
    }

    // update alert
    async function handleUpdateAlert(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAlert?.id) return;

        const payload: AlertForm = {
            severity: selectedAlert.severity,
            status: selectedAlert.status,
            event_id: selectedAlert.event_id ?? null,
            rule_id: selectedAlert.rule_id ?? null,
        };

        try {
            const response = await fetch(`http://127.0.0.1:8000/alerts/${selectedAlert.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update alert");
            }

            const updatedAlert = await response.json();
            toast.success(`Alert updated successfully!`);

            // update local alerts list
            setAlerts(prev => prev.map(alert => (alert.id === updatedAlert.id ? updatedAlert : alert)));

            // close the form
            setSelectedAlert(null);

        } catch (err: any) {
            console.error(err);
            toast.error(`Error updating alert: ${err.message}`);
        }
    }

    // delete alert
    async function handleDeleteAlert(alertId: number) {
        if (!window.confirm("Are you sure you want to delete this alert?")) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/alerts/${alertId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete alert");
            }

            toast.success("Alert deleted successfully");

            // remove the deleted alert from the local state
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));

        } catch (err) {
            console.error(err);
            toast.error("Error deleting alert");
        }
    }

    // handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
                `http://127.0.0.1:8000/alerts/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
                console.log("No more events");
                setHasMore(false);
                return;
            }

            setAlerts(data);
            setPage(nextPage);
        } catch (err) {
            console.error("Error fetching events:", err);
        }
    };

    // handle prev page
    const handlePrev = async () => {
        if (page <= 0) return;

        const prevPage = Math.max(page - 10, 0);

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/alerts/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setAlerts(data);
            setHasMore(true);
            setPage(prevPage);
        } catch (err) {
            console.error("Error fetching events:", err);
        }
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

                                        {/* Event (brief) */}
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

                                        {/* Rule (brief) */}
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
                                            <button onClick={() => handleModifyAlert(alert)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="mx-2 bg-danger"
                                                onClick={() => handleDeleteAlert(alert.id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
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
                            <button
                                className="btn btn-success w-100"
                                onClick={() => handleNewAlert()}
                            >Add User</button>
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
                        <h5 className="card-title card_title">
                            {selectedAlert.id ? "Modify Alert" : "Add New Alert"}
                        </h5>
                        <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid" />
                        <div className="card-body">
                            <form onSubmit={selectedAlert.id ? handleUpdateAlert : handleCreateAlert}>

                                {/* Severity */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Severity:</label>
                                    </div>
                                    <div className="col-8">
                                        <select
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="severity"
                                            value={selectedAlert.severity}
                                            onChange={handleAlertChange}
                                            required
                                        >
                                            <option value="" disabled>-- Select Severity --</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Status:</label>
                                    </div>
                                    <div className="col-8">
                                        <select
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="status"
                                            value={selectedAlert.status}
                                            onChange={handleAlertChange}
                                            required
                                        >
                                            <option value="" disabled>-- Select Status --</option>
                                            <option value="open">Open</option>
                                            <option value="acknowledged">Acknowledged</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Event (read-only) */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Event:</label>
                                    </div>
                                    <div className="col-8">
                                        {selectedAlert.id && (<textarea
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
                                            readOnly
                                            name="event"
                                            rows={10}
                                            value={selectedEvent ? `ID: ${selectedEvent.id}\nName: ${selectedEvent.event_type}\nSeverity: ${selectedEvent.severity}\nMessage: ${selectedEvent.message}\nTimeStamp: ${selectedEvent.timestamp}\nHost: ${selectedEvent.asset.name}\n${selectedEvent.asset.ip_address}` : "N/A"}
                                        />)}
                                        {!selectedAlert.id && (
                                            <input
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="event_id"
                                                value={selectedAlert?.event_id ?? ""}
                                                onChange={handleAlertChange}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Rule (read-only) */}
                                <div className="row mb-3">
                                    <div className="col-4">
                                        <label>Rule:</label>
                                    </div>
                                    <div className="col-8">
                                        {selectedAlert.id && (<textarea
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
                                            readOnly
                                            name="rule"
                                            rows={10}
                                            value={selectedRule ? `ID: ${selectedRule.id}\nName: ${selectedRule.name}\nSeverity: ${selectedRule.severity}\nEnabled: ${selectedRule.enabled}\nDescription: ${selectedRule.description}` : "N/A"}
                                        />)}
                                        {!selectedAlert.id && (
                                            <input
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="rule_id"
                                                value={selectedAlert?.rule_id ?? ""}
                                                onChange={handleAlertChange}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="row mt-3">
                                    <div className="col-6"></div>
                                    <div className="col-3">
                                        <button type="submit" className="btn btn-success w-100">
                                            {selectedAlert.id ? "Save" : "Create"}
                                        </button>
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn btn-primary w-100"
                                            onClick={() => setSelectedAlert(null)}
                                        >
                                            Cancel
                                        </button>
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