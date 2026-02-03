import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function AuditManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogForm | null>(null);

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

    // fetch auditlogs
    const fetchAuditLogs = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/auditlogs/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch auditlogs");
            const data: AuditLog[] = await res.json();
            setAuditLogs(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching auditlogs: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchAuditLogs(0);
    }, [fetchAuditLogs]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchAuditLogs(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchAuditLogs(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, log: AuditLog) => {
        e.preventDefault()
        setSelectedAuditLog({
            id: log.id,
            action: log.action,
            target_type: log.target_type,
            target_id: log.target_id,
            user_id: log.user?.id,
        });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        e.preventDefault()
        const { name, value, dataset } = e.target
        const parsed = dataset.type === "number" ? value === "" ? null : Number(value) : value
        setSelectedAuditLog(prev => ({ ...prev!, [name]: parsed, }))
    }

    // create audit_log
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this auditlog?")) return;
        if (!selectedAuditLog) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/auditlogs/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAuditLog),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `auditlog`, created.id, 1)
            toast.success(`AuditLog created successfully! ID: ${created.id}`);
            setSelectedAuditLog(null);
        } catch (err: any) {
            toast.error(`Error creating auditlog: ${err.message}`);
        }
    }

    // update auditlog
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAuditLog?.id) return;
        if (!window.confirm("Are you sure you want to update this auditlog?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/auditlogs/${selectedAuditLog.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAuditLog),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `auditlog`, updated.id, 1)
            toast.success(`AuditLog updated successfully! ID: ${selectedAuditLog.id}`);
            setAuditLogs(prev => prev.map(auditlog => (auditlog.id === updated.id ? updated : auditlog)));
            setSelectedAuditLog(null);
        } catch (err: any) {
            toast.error(`Error updating auditlog: ${err.message}`);
        }
    }

    // delete auditlog
    async function handleDelete(auditlogId: number) {
        if (auditlogId <= 0) return
        if (!window.confirm("Are you sure you want to delete this auditlog?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/auditlogs/${auditlogId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `auditlog`, auditlogId, 1)
            toast.success(`AuditLog deleted successfully! ID: ${auditlogId}`);
            setAuditLogs(prev => prev.filter(auditlog => auditlog.id !== auditlogId));
        } catch (err: any) {
            toast.error(`Error deleting auditlog: ${err.message}`);
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
                <h5>Audit Management</h5>
            </div>
            <div className={selectedAuditLog ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">Audits</h5>
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
                                        <td className="action-block">
                                            <button className="blue_b p-1" onClick={(e) => handleModify(e,log)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 red_b p-1" onClick={() => handleDelete(log.id)}>
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
                                    onClick={() =>
                                        setSelectedAuditLog({
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
                            <button type="button" className="btn blue_b w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedAuditLog && (
                <div className="col-md-12 col-lg-6">
                    <div className="card h-100">
                        <h5 className="card-title card_title">
                            {selectedAuditLog.id ? "Modify Audit Log" : "Add New Audit Log"}
                        </h5>
                        <img
                            src="src/assets/banner_red.png"
                            alt="Card banner"
                            className="img-fluid"
                        />
                        <div className="card-body">
                            <form onSubmit={selectedAuditLog.id ? handleUpdate : handleCreate}>
                                {/* Action */}
                                <div className="row mb-2">
                                    <div className="col-4">
                                        <label>Action:</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="action"
                                            value={selectedAuditLog.action || ""}
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
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="target_type"
                                            value={selectedAuditLog.target_type || ""}
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
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="target_id"
                                            value={selectedAuditLog.target_id ?? ""}
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
                                            className="rounded border border-2 border-dark text-light bg-dark"
                                            name="user_id"
                                            value={selectedAuditLog.user_id ?? ""}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="row mt-3">
                                    <div className="col-6"></div>
                                    <div className="col-3">
                                        <button type="submit" className="btn green_b w-100">
                                            {selectedAuditLog.id ? "Save" : "Create"}
                                        </button>
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn blue_b w-100"
                                            onClick={() => setSelectedAuditLog(null)}
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