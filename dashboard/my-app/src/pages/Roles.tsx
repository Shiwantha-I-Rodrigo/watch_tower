import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function RoleManagement() {
    const [page, setPage] = useState(0);
    const [roles, setRoles] = useState<Role[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [selectedRole, setSelectedRole] = useState<RoleForm | null>(null);

    type Role = {
        id: number;
        name: string;
    };

    type RoleForm = Partial<Role>

    // Fetch roles on load
    useEffect(() => {
        fetch("http://127.0.0.1:8000/roles/?skip=0&limit=10")
            .then(res => res.json())
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (role: Role) => {
        setSelectedRole({ ...role });
    };

    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSelectedRole(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name]: value
            };
        });
    };

    // Create user
    const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedRole) return;

        if (!confirm("Are you sure you want to create this role?")) return;

       const payload = {
            name: selectedRole!.name,
        };

        fetch("http://127.0.0.1:8000/roles/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create role");
                }
                return res.json();
            })
            .then((newRole: Role) => {
                setRoles(prev => [...prev, newRole]);
                toast.success("User created!");
                setSelectedRole(null);
            })
            .catch(err => {
                console.error("Error creating user:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated role
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedRole) return;

        if (!confirm("Are you sure you want to update this?")) return;

        const payload = {
            name: selectedRole.name,
        };

        fetch(`http://127.0.0.1:8000/roles/${selectedRole.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update role");
                }
                return res.json();
            })
            .then((updatedRole: Role) => {
                setRoles(prevRoles =>
                    prevRoles.map(u =>
                        u.id === updatedRole.id ? updatedRole : u
                    )
                );
                toast.success("Role updated!");
            })
            .catch(err => {
                console.error("Error updating role:", err);
                toast.error("Update failed");
            });
    };

    // delete role
    const handleDeleteRole = (roleId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        fetch(`http://127.0.0.1:8000/roles/${roleId}`, {
            method: "DELETE",
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to delete role");
                }

                // Remove user from local state
                setRoles(prevRoles =>
                    prevRoles.filter(role => role.id !== roleId)
                );

                toast.success("User deleted!");
            })
            .catch(err => {
                console.error("Error deleting role:", err);
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

            setRoles(data);
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

            setRoles(data);
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
                                            <button onClick={() => handleModifyClick(role)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDeleteRole(role.id)}>
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
                        <form onSubmit={selectedRole.id ? handleSubmit : handleCreateRole}>

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