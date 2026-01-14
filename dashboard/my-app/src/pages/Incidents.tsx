import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

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


    // fetch alerts
    useEffect(() => {
        fetch("http://127.0.0.1:8000/incidents/?skip=0&limit=10")
            .then(res => { if (!res.ok) { throw new Error("Failed to fetch alerts"); } return res.json(); })
            .then((data: Incident[]) => { setIncidents(data); setHasMore(data.length === 10); })
            .catch(err => { console.error("Error fetching alerts:", err); toast.error("Error fetching alerts"); });
    }, []);


    // handle modify
    function handleModifyIncident(incident: IncidentForm) {
        setSelectedIncident(incident);
    }


    // handle new
    function handleNewIncident() {
        setSelectedIncident({ id: undefined, title: "", description : "", severity: "", status: "", alert_ids: [] });
    }


    // handle change for normal fields
    const handleIncidentChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setSelectedIncident(prev =>
        prev ? { ...prev, [name]: value } : prev
        );
    };

    // handle change for individual alert id
    const handleAlertIdChange = (index: number, value: string) => {
        const parsed = Number(value);
        setSelectedIncident(prev => {
        if (!prev) return prev;
        const alert_ids = [...prev.alert_ids];
        alert_ids[index] = Number.isNaN(parsed) ? 0 : parsed;
        return { ...prev, alert_ids };
        });
    };

    // add new alert
    const addAlert = () => {
        setSelectedIncident(prev => prev ? { ...prev, alert_ids: [...prev.alert_ids, 0] } : prev);
    };

    // remove alert
    const removeAlert = (index: number) => {
        setSelectedIncident(prev => {
        if (!prev) return prev;
        const alert_ids = prev.alert_ids.filter((_, i) => i !== index);
        return { ...prev, alert_ids };
        });
    };

    function incidentToForm(incident: Incident): IncidentForm {
    return {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        alert_ids: incident.alerts.map(alert => alert.id),
    };
    }


    // create incident
    const createIncident = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedIncident) return;

        if (!confirm("Are you sure you want to create this incident?")) return;

        const payload: IncidentForm = {
            title: selectedIncident.title,
            description: selectedIncident.description,
            severity: selectedIncident.severity,
            status: selectedIncident.status,
            alert_ids: selectedIncident.alert_ids,
        };

        fetch("http://127.0.0.1:8000/incidents/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create incident");
                }
                return res.json();
            })
            .then((newIncident: Incident) => {
                setIncidents(prev => [...prev, newIncident]);
                toast.success("Incident created!");
                setSelectedIncident(null);
            })
            .catch(err => {
                console.error("Error creating incident:", err);
                toast.error("Create failed");
            });
    };


    // update incident
    const updateIncident = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedIncident || !selectedIncident.id) return;

        if (!confirm("Are you sure you want to update this incident?")) return;

        const payload: IncidentForm = {
            title: selectedIncident.title,
            description: selectedIncident.description,
            severity: selectedIncident.severity,
            status: selectedIncident.status,
            alert_ids: selectedIncident.alert_ids ?? [],
        };

        fetch(`http://127.0.0.1:8000/incidents/${selectedIncident.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update incident");
                }
                return res.json();
            })
            .then((updatedIncident: Incident) => {
                setIncidents(prev =>
                    prev.map(i =>
                        i.id === updatedIncident.id ? updatedIncident : i
                    )
                );
                toast.success("Incident updated!");
                setSelectedIncident(null);
            })
            .catch(err => {
                console.error("Error updating incident:", err);
                toast.error("Update failed");
            });
    };


    // delete alert
    const deleteIncident = async (id: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/incidents/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete incident");
            }

            setIncidents(prev => prev.filter(inc => inc.id !== id));
            toast.success("Incident deleted");
        } catch (err) {
            console.error(err);
            toast.error("Error deleting incident");
        }
    };


    // handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
                `http://127.0.0.1:8000/incidents/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
                console.log("No more events");
                setHasMore(false);
                return;
            }

            setIncidents(data);
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
                `http://127.0.0.1:8000/incidents/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setIncidents(data);
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
            <div className={selectedIncident ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">System Users</h5>
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

                                        <td>
                                            <button onClick={() => handleModifyIncident(incidentToForm(incident))}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="mx-2 bg-danger"
                                                onClick={() => deleteIncident(incident.id)}
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
                                onClick={() => handleNewIncident()}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
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
                        <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid" />

                        <div className="card-body">
                            <form onSubmit={selectedIncident.id ? updateIncident : createIncident} >

                                {/* Title */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Title:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
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
                                            className="rounded text-dark bg-light border border-2 border-dark w-100"
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
                                            className="rounded text-dark bg-light border border-2 border-dark"
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
                                            className="rounded text-dark bg-light border border-2 border-dark"
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
                                                className="form-control alert-id-input m-0 bg-light border border-2 border-dark"
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
                                        <button type="submit" className="btn btn-success w-100">
                                            {selectedIncident.id ? "Save" : "Create"}
                                        </button>
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn btn-primary w-100"
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