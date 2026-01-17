import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function AuditManagement() {
    const [page, setPage] = useState(0);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLogForm | null>(null);

    type AuditLog = {
        id: number;
        action: string;
        target_type: string;
        target_id?: number | null;
        user?: { id: number; username: string } | null;
        timestamp: string;
    };

    type AuditLogForm = {
        id?: number;
        action: string;
        target_type: string;
        target_id?: number | null;
        user_id?: number | null;
    };

    // Fetch audit logs on load
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/auditlogs/?skip=0&limit=10`)
            .then(res => res.json())
            .then(data => setAuditLogs(data))
            .catch(err => console.error("Error fetching audit logs:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (log: AuditLog) => {
        setSelectedLog({
            id: log.id,
            action: log.action,
            target_type: log.target_type,
            target_id: log.target_id,
            user_id: log.user?.id,
        });
    };

    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSelectedLog(prev => prev ? { ...prev, [name]: value } : prev);
    };

    // Create audit log
    const handleCreateLog = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLog) return;
        if (!confirm("Are you sure you want to create this audit log?")) return;

        const payload = {
            action: selectedLog.action,
            target_type: selectedLog.target_type,
            target_id: selectedLog.target_id,
            user_id: selectedLog.user_id
        };

        fetch("http://127.0.0.1:8000/auditlogs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to create audit log");
                return res.json();
            })
            .then((newLog: AuditLog) => {
                setAuditLogs(prev => [...prev, newLog]);
                toast.success("Audit log created!");
                setSelectedLog(null);
            })
            .catch(err => {
                console.error("Error creating audit log:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated audit log (PATCH)
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLog || !selectedLog.id) return;
        if (!confirm("Are you sure you want to update this audit log?")) return;

        const payload: AuditLogForm = {
            action: selectedLog.action,
            target_type: selectedLog.target_type,
            target_id: selectedLog.target_id,
            user_id: selectedLog.user_id
        };

        fetch(`http://127.0.0.1:8000/auditlogs/${selectedLog.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update audit log");
                return res.json();
            })
            .then((updatedLog: AuditLog) => {
                setAuditLogs(prev =>
                    prev.map(log => log.id === updatedLog.id ? updatedLog : log)
                );
                toast.success("Audit log updated!");
                setSelectedLog(null);
            })
            .catch(err => {
                console.error("Error updating audit log:", err);
                toast.error("Update failed");
            });
    };

    // Delete audit log
    const handleDeleteLog = (logId: number) => {
        if (!confirm("Are you sure you want to delete this audit log?")) return;

        fetch(`http://127.0.0.1:8000/auditlogs/${logId}`, { method: "DELETE" })
            .then(res => {
                if (!res.ok) throw new Error("Failed to delete audit log");
                setAuditLogs(prev => prev.filter(log => log.id !== logId));
                toast.success("Audit log deleted!");
            })
            .catch(err => {
                console.error("Error deleting audit log:", err);
                toast.error("Delete failed");
            });
    };

    // Handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
                `http://127.0.0.1:8000/users/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
                console.log("No more users");
                setHasMore(false);
                return;
            }

            setAuditLogs(data);
            setPage(nextPage);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // Handle prev page
    const handlePrev = async () => {
        if (page <= 0) return;

        const prevPage = Math.max(page - 10, 0);

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/users/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setAuditLogs(data);
            setHasMore(true);
            setPage(prevPage);
        } catch (err) {
            console.error("Error fetching users:", err);
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
                                    <th>Action</th>
                                    <th>Target Type</th>
                                    <th>Target ID</th>
                                    <th>User</th>
                                    <th>Timestamp</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{log.action}</td>
                                        <td>{log.target_type}</td>
                                        <td>{log.target_id ?? "-"}</td>
                                        <td>{log.user ? log.user.username : "-"}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(log)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="mx-2 bg-danger"
                                                onClick={() => handleDeleteLog(log.id)}
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
                                    onClick={() =>
                                        setSelectedLog({
                                            action: "",
                                            target_type: "",
                                            target_id: undefined,
                                            user_id: undefined,
                                        })
                                    }
                                >
                                    Add Audit Log
                                </button>
                            </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div className="col-md-12 col-lg-6">
                    <div className="card h-100">
                        <h5 className="card-title card_title">
                            {selectedLog.id ? "Modify Audit Log" : "Add New Audit Log"}
                        </h5>
                        <img
                            src="src/assets/banner_blue.png"
                            alt="Card banner"
                            className="img-fluid"
                        />
                        <div className="card-body">
                            <form onSubmit={selectedLog.id ? handleSubmit : handleCreateLog}>
                                {/* Action */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Action:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="action"
                                            value={selectedLog.action || ""}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Target Type */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Target Type:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="target_type"
                                            value={selectedLog.target_type || ""}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Target ID */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Target ID:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="number"
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="target_id"
                                            value={selectedLog.target_id ?? ""}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* User ID */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>User ID:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="number"
                                            className="rounded text-dark bg-light border border-2 border-dark"
                                            name="user_id"
                                            value={selectedLog.user_id ?? ""}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="row mt-3">
                                    <div className="col-6"></div>
                                    <div className="col-3">
                                        <button type="submit" className="btn btn-success w-100">
                                            {selectedLog.id ? "Save" : "Create"}
                                        </button>
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn btn-primary w-100"
                                            onClick={() => setSelectedLog(null)}
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

export default AuditManagement;