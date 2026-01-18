import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function LogManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [logs, setLogs] = useState<RawLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<RawLogForm | null>(null);

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

    type RawLog = {
        id: number;
        raw_payload: Record<string, any>;
        ingested_at: string;
        event: Event;
    };

    type RawLogForm = {
        id?: number;
        event_id: number;
        raw_payload: string;
    };

    // fetch rawlogs
    const fetchLogs = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/rawlogs/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch rawlogs");
            const data: RawLog[] = await res.json();
            setLogs(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching rawlogs: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchLogs(0);
    }, [fetchLogs]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchLogs(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchLogs(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, log: RawLog) => {
        e.preventDefault()
        setSelectedLog({
            id: log.id,
            event_id: log.event.id,
            raw_payload: JSON.stringify(log.raw_payload, null, 2),
        });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        e.preventDefault()
        const { name, value, dataset } = e.target
        const parsed = dataset.type === "number" ? value === "" ? null : Number(value) : value
        setSelectedLog(prev => ({ ...prev!, [name]: parsed, }))
    }

    // create log
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this log?")) return;
        if (!selectedLog) return;
        try {
            const payload = {
                event_id: selectedLog.event_id,
                raw_payload: JSON.parse(selectedLog.raw_payload)
            };
            const response = await fetch("http://127.0.0.1:8000/rawlogs/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `log`, created.id, 1)
            toast.success(`Log created successfully! ID: ${created.id}`);
            setSelectedLog(null);
        } catch (err: any) {
            toast.error(`Error creating log: ${err.message}`);
        }
    }

    // update log
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedLog?.id) return;
        if (!window.confirm("Are you sure you want to update this log?")) return;
        try {
            const payload = {
                event_id: selectedLog.event_id,
                raw_payload: JSON.parse(selectedLog.raw_payload)
            };
            const response = await fetch(`http://127.0.0.1:8000/rawlogs/${selectedLog.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `log`, updated.id, 1)
            toast.success(`Log updated successfully! ID: ${selectedLog.id}`);
            setLogs(prev => prev.map(log => (log.id === updated.id ? updated : log)));
            setSelectedLog(null);
        } catch (err: any) {
            toast.error(`Error updating log: ${err.message}`);
        }
    }

    // delete log
    async function handleDelete(logId: number) {
        if (logId <= 0) return
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/rawlogs/${logId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `log`, logId, 1)
            toast.success(`Log deleted successfully! ID: ${logId}`);
            setLogs(prev => prev.filter(log => log.id !== logId));
        } catch (err: any) {
            toast.error(`Error deleting log: ${err.message}`);
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
            <div className={selectedLog ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">System Users</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        {/*TABLE*/}
                        <table cellPadding="1" className="w-100">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event ID</th>
                                    <th>Ingested Time</th>
                                    <th>Payload</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{log.event.id}</td>
                                        <td>{log.ingested_at}</td>
                                        <td className="json-cell">{JSON.stringify(log.raw_payload)}</td>
                                        <td>
                                            <button onClick={(e) => handleModify(e,log)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDelete(log.id)}>
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
                                onClick={() => setSelectedLog({ event_id: 0, raw_payload: ""})}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedLog && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedLog.id ? "Modify User" : "Add New User"}</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedLog.id ? handleUpdate : handleCreate}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Event ID:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="event_id"
                                        value={selectedLog.event_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Payload:</label>
                                </div>
                                <div className="col-8">
                                    <textarea
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="raw_payload"
                                        style={{ height: "300px" }}
                                        value={selectedLog.raw_payload}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-6">
                                </div>
                                <div className="col-3">
                                    <button type="submit" className="btn btn-success w-100">
                                        {selectedLog.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedLog(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}

        <ToastContainer />
        </div>
    )
}

export default LogManagement;