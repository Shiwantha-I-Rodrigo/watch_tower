import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function IncidentManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<IncidentForm | null>(null);

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

    type Incident = {
        id: number;
        title: string;
        description: string;
        status: string;
        severity: string;
        created_at: string;
        alerts: Alert[];
    };

    type IncidentForm = {
        id?: number;
        title: string;
        description: string;
        status: string;
        severity: string;
        alert_ids: number[];
    };

    // fetch incidents
    const fetchIncidents = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/incidents/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch incidents");
            const data: Incident[] = await res.json();
            setIncidents(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching incidents: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchIncidents(0);
    }, [fetchIncidents]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchIncidents(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchIncidents(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, incident: Incident) => {
        e.preventDefault()
        setSelectedIncident({
            id: incident.id,
            title: incident.title,
            description: incident.description,
            status: incident.status,
            severity: incident.severity,
            alert_ids: incident.alerts.map(alert => alert.id),
        });
    }

    // handle new form
    function handleNewIncident() {
        setSelectedIncident({
            id: undefined,
            title: "",
            description : "",
            severity: "",
            status: "",
            alert_ids: [] });
    }

    // handle input change (normal fields)
    const handleIncidentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.preventDefault()
        const { name, value } = e.target;
        setSelectedIncident(prev => prev ? { ...prev, [name]: value } : prev);
    };

    // handle input change (alert ids)
    const handleAlertIdChange = (index: number, value: string) => {
        const parsed = Number(value);
        setSelectedIncident(prev => {
        if (!prev) return prev;
        const alert_ids = [...prev.alert_ids];
        alert_ids[index] = Number.isNaN(parsed) ? 0 : parsed;
        return { ...prev, alert_ids };
        });
    };

    // add a new alert
    const addAlert = () => {
        setSelectedIncident(prev => prev ? { ...prev, alert_ids: [...prev.alert_ids, 0] } : prev);
    };

    // remove an alert
    const removeAlert = (index: number) => {
        setSelectedIncident(prev => {
        if (!prev) return prev;
        const alert_ids = prev.alert_ids.filter((_, i) => i !== index);
        return { ...prev, alert_ids };
        });
    };

    // create incident
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this incident?")) return;
        if (!selectedIncident) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/incidents/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedIncident),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `incident`, created.id, 1)
            toast.success(`Incident created successfully! ID: ${created.id}`);
            setSelectedIncident(null);
        } catch (err: any) {
            toast.error(`Error creating incident: ${err.message}`);
        }
    };

    // update incident
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedIncident?.id) return;
        if (!window.confirm("Are you sure you want to update this incident?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/incidents/${selectedIncident.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedIncident),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `incident`, updated.id, 1)
            toast.success(`Incident updated successfully! ID: ${selectedIncident.id}`);
            setIncidents(prev => prev.map(incident => (incident.id === updated.id ? updated : incident)));
            setSelectedIncident(null);
        } catch (err: any) {
            toast.error(`Error updating incident: ${err.message}`);
        }
    }

    // delete incident
    async function handleDelete(incidentId: number) {
        if (incidentId <= 0) return
        if (!window.confirm("Are you sure you want to delete this incident?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/incidents/${incidentId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `incident`, incidentId, 1)
            toast.success(`Incident deleted successfully! ID: ${incidentId}`);
            setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
        } catch (err: any) {
            toast.error(`Error deleting incident: ${err.message}`);
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
                <h5>Incident Management</h5>
            </div>
            <div className={selectedIncident ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">Incidents</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        {/*TABLE*/}
                        <table cellPadding="1" className="w-100">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Severity</th>
                                    <th>Created At</th>
                                    <th>Alerts</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map(incident => (
                                    <tr key={incident.id}>
                                        <td>{incident.id}</td>

                                        <td>
                                            <div><strong>{incident.title}</strong></div>
                                            <div className="text-muted small">
                                                {incident.description.slice(0, 40)}…
                                            </div>
                                        </td>

                                        <td>{incident.status}</td>
                                        <td>{incident.severity}</td>

                                        <td>{new Date(incident.created_at).toLocaleString()}</td>

                                        {/* Alerts (brief) */}
                                        <td>
                                            {incident.alerts && incident.alerts.length > 0 ? (
                                                <>
                                                    <div>
                                                        <strong>{incident.alerts.length}</strong> alert(s)
                                                    </div>
                                                    <div className="text-muted small">
                                                        {incident.alerts.slice(0, 2).map(alert => (
                                                            <span key={alert.id} className="me-2">
                                                                #{alert.id} ({alert.severity})
                                                            </span>
                                                        ))}
                                                        {incident.alerts.length > 2 && "…"}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted">None</span>
                                            )}
                                        </td>

                                        <td className="action-block">
                                            <button className="blue_b p-1" onClick={(e) => handleModify(e,incident)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 red_b p-1" onClick={() => handleDelete(incident.id)}>
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
                            <button type="button" className="btn blue_b w-100" disabled={page === 0} onClick={() => handlePrev()}>Previous</button>
                        </div>
                        <div className="col-3">
                            <button
                                className="btn green_b w-100"
                                onClick={() => handleNewIncident()}
                            >Add Incident</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn blue_b w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedIncident && (
                <div className="col-md-12 col-lg-6">
                    <div className="card h-100">
                        <h5 className="card-title card_title">
                            {selectedIncident.id ? "Modify Incident" : "Add New Incident"}
                        </h5>
                        <img src="src/assets/banner_green.png" alt="Card image" className="img-fluid" />

                        <div className="card-body">
                            <form onSubmit={selectedIncident.id ? handleUpdate : handleCreate} >

                                {/* Title */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Title:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            className="rounded border border-2 border-dark text-light bg-dark w-100"
                                            name="title"
                                            value={selectedIncident.title}
                                            onChange={handleIncidentChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Description:</label>
                                    </div>
                                    <div className="col-8">
                                        <textarea
                                            className="rounded border border-2 border-dark text-light bg-dark w-100"
                                            name="description"
                                            rows={4}
                                            value={selectedIncident.description}
                                            onChange={handleIncidentChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Severity */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Severity:</label>
                                    </div>
                                    <div className="col-8 d-flex">
                                        <select
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="severity"
                                            value={selectedIncident.severity}
                                            onChange={handleIncidentChange}
                                            required
                                        >
                                            <option value="" disabled>-- Select Severity --</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="row mb-3">
                                    <div className="col-4">
                                        <label>Status:</label>
                                    </div>
                                    <div className="col-8 d-flex">
                                        <select
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="status"
                                            value={selectedIncident.status}
                                            onChange={handleIncidentChange}
                                            required
                                        >
                                            <option value="" disabled>-- Select Status --</option>
                                            <option value="open">Open</option>
                                            <option value="acknowledged">Acknowledged</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Alerts (Attach / Detach) */}
                                <div className="row mb-3">
                                    <div className="col-4">
                                        <label>Alerts:</label>
                                    </div>

                                    <div className="col-8">
                                        {selectedIncident.alert_ids.map((id, index) => (
                                        <div key={index} className="row mb-2 align-items-center text-start">
                                            <div className="col-auto d-flex align-items-center">
                                            <input
                                                type="number"
                                                className="form-control alert-id-input m-0 border border-2 border-dark text-light bg-dark"
                                                value={id}
                                                onChange={e => handleAlertIdChange(index, e.target.value)}
                                            />
                                            </div>

                                            <div className="col-auto d-flex align-items-center ms-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger alert-btn"
                                                onClick={() => removeAlert(index)}
                                            >
                                                Remove
                                            </button>
                                            </div>
                                        </div>
                                        ))}

                                        <div className="d-flex align-items-center mt-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary alert-btn mt-2"
                                            onClick={addAlert}
                                        >
                                            + Add Alert
                                        </button>
                                        </div>

                                        <div className="text-muted small mt-1 text-start">
                                        Removing an alert detaches the alert from the incident !
                                        </div>
                                    </div>
                                    </div>


                                {/* Buttons */}
                                <div className="row mt-3">
                                    <div className="col-6"></div>
                                    <div className="col-3">
                                        <button type="submit" className="btn green_b w-100">
                                            {selectedIncident.id ? "Save" : "Create"}
                                        </button>
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn blue_b w-100"
                                            onClick={() => setSelectedIncident(null)}
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

export default IncidentManagement;