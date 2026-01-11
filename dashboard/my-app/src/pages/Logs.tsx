import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

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

    // Fetch logs on load
    useEffect(() => {
    fetch("http://127.0.0.1:8000/rawlogs/?skip=0&limit=50")
        .then(res => res.json())
        .then(data => setLogs(data))
        .catch(err => console.error("Error fetching logs:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (log: RawLog) => {
        setSelectedLog({
            id: log.id,
            event_id: log.event.id,
            raw_payload: JSON.stringify(log.raw_payload, null, 2),
        });
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setSelectedLog(prev => {
            if (!prev) return prev;

            // numeric fields
            if (name === "event_id") {
                return {
                    ...prev,
                    event_id: Number(value),
                };
            }

            // raw_payload stays STRING here
            if (name === "raw_payload") {
                return {
                    ...prev,
                    raw_payload: value,
                };
            }

            return {
                ...prev,
                [name]: value,
            };
        });
    };


    // Create log
    const handleCreateLog = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLog) return;

        fetch("http://127.0.0.1:8000/rawlogs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event_id: selectedLog.event_id,
                raw_payload: JSON.parse(selectedLog.raw_payload),
            }),
        })
            .then(res => res.json())
            .then((newLog: RawLog) => {
                setLogs(prev => [...prev, newLog]);
                toast.success("Log created!");
                setSelectedLog(null);
            })
            .catch(() => toast.error("Failed to create log"));
    };


    // Submit updated log
    const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLog?.id) return;

        fetch(`http://127.0.0.1:8000/rawlogs/${selectedLog.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                raw_payload: JSON.parse(selectedLog.raw_payload),
                event_id: selectedLog.event_id,
            }),
        })
            .then(res => res.json())
            .then((updated: RawLog) => {
                setLogs(prev =>
                    prev.map(l => (l.id === updated.id ? updated : l))
                );
                toast.success("Log updated!");
            })
            .catch(() => toast.error("Update failed"));
    };


    // delete log
    const handleDeleteLog = (logId: number) => {
        if (!confirm("Delete this log?")) return;

        fetch(`http://127.0.0.1:8000/rawlogs/${logId}`, {
            method: "DELETE",
        })
            .then(() => {
                setLogs(prev => prev.filter(l => l.id !== logId));
                toast.success("Log deleted!");
            })
            .catch(() => toast.error("Delete failed"));
    };


    // Handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
            `http://127.0.0.1:8000/logs/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
            console.log("No more logs");
            setHasMore(false);
            return;
            }

            setLogs(data);
            setPage(nextPage);
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
    };

    // Handle prev page
    const handlePrev = async () => {
        if (page <= 0) return;

        const prevPage = Math.max(page - 10, 0);

        try {
            const res = await fetch(
            `http://127.0.0.1:8000/logs/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setLogs(data);
            setHasMore(true);
            setPage(prevPage);
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
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
                                            <button onClick={() => handleModifyClick(log)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDeleteLog(log.id)}>
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
                        <form onSubmit={selectedLog.id ? handleSubmit : handleCreateLog}>

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