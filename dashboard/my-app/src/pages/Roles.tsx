import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function RoleManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<RoleForm | null>(null);

    type Role = {
        id: number;
        name: string;
    };

    type RoleForm = Partial<Role>

    // fetch roles
    const fetchRoles = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/roles/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch roles");
            const data: Role[] = await res.json();
            setRoles(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching roles: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchRoles(0);
    }, [fetchRoles]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchRoles(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchRoles(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, role: Role) => {
        e.preventDefault()
        setSelectedRole({ ...role });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        e.preventDefault()
        const { name, value, dataset } = e.target
        const parsed = dataset.type === "number" ? value === "" ? null : Number(value) : value
        setSelectedRole(prev => ({ ...prev!, [name]: parsed, }))
    }

    // create role
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this role?")) return;
        if (!selectedRole) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/roles/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedRole),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `role`, created.id, 1)
            toast.success(`Role created successfully! ID: ${created.id}`);
            setSelectedRole(null);
        } catch (err: any) {
            toast.error(`Error creating role: ${err.message}`);
        }
    }

    // update role
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRole?.id) return;
        if (!window.confirm("Are you sure you want to update this role?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/roles/${selectedRole.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedRole),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `role`, updated.id, 1)
            toast.success(`Role updated successfully! ID: ${selectedRole.id}`);
            setRoles(prev => prev.map(role => (role.id === updated.id ? updated : role)));
            setSelectedRole(null);
        } catch (err: any) {
            toast.error(`Error updating role: ${err.message}`);
        }
    }

    // delete role
    async function handleDelete(roleId: number) {
        if (roleId <= 0) return
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/roles/${roleId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `role`, roleId, 1)
            toast.success(`Role deleted successfully! ID: ${roleId}`);
            setRoles(prev => prev.filter(role => role.id !== roleId));
        } catch (err: any) {
            toast.error(`Error deleting role: ${err.message}`);
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
            <div className={selectedRole ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">System Users</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        {/*TABLE*/}
                        <table cellPadding="1" className="w-100">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td>{role.id}</td>
                                        <td>{role.name}</td>
                                        <td>
                                            <button onClick={(e) => handleModify(e,role)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDelete(role.id)}>
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
                                onClick={() => setSelectedRole({ name: "" })}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedRole && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedRole.id ? "Modify User" : "Add New User"}</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedRole.id ? handleUpdate : handleCreate}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="name"
                                        value={selectedRole.name}
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
                                        {selectedRole.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedRole(null)}>Cancel</button>
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

export default RoleManagement;