import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function UserManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserForm | null>(null);
    

    type User = {
        username: string,
        email: string,
        is_active: boolean,
        id: number,
        roles: Role[],
        created_at: string,
    };

    type Role = {
        id: number;
        name: string;
    };

    type UserForm = Partial<User> & { password?: string };

    // fetch users
    const fetchUsers = useCallback(async (skip: number) => {
        try {const res1 = await fetch(`http://127.0.0.1:8000/roles/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res1.ok) throw new Error("Failed to fetch roles");
            const data1: Role[] = await res1.json();
            setRoles(data1);
            const res2 = await fetch(`http://127.0.0.1:8000/users/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res2.ok) throw new Error("Failed to fetch users");
            const data2: User[] = await res2.json();
            setUsers(data2);
            setHasMore(data2.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching users: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchUsers(0);
    }, [fetchUsers]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchUsers(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchUsers(Math.max(page - PAGE_LIMIT, 0));
    };

   // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, user: User) => {
        e.preventDefault()
        setSelectedUser({ ...user });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        const { name, value, type, checked } = e.target;
        setSelectedUser(prev => {
            if (!prev) return prev;
            return {...prev,[name]: type === "checkbox" ? checked : value};
        });
    };

    // create user
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this user?")) return;
        if (!selectedUser) return;
        try {
            const payload = {
                username: selectedUser!.username,
                email: selectedUser!.email,
                is_active: selectedUser!.is_active,
                password: selectedUser!.password,
                role_ids: selectedUser.roles?.map(r => r.id) || [],
            };
            const response = await fetch("http://127.0.0.1:8000/users/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `user`, created.id, 1)
            toast.success(`User created successfully! ID: ${created.id}`);
            setSelectedUser(null);
        } catch (err: any) {
            toast.error(`Error creating user: ${err.message}`);
        }
    }

    // update user
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedUser?.id) return;
        if (!window.confirm("Are you sure you want to update this user?")) return;
        try {
            const payload = {
                username: selectedUser.username,
                email: selectedUser.email,
                is_active: selectedUser.is_active,
                // password: newPassword, // only if changing password
                role_ids: selectedUser.roles?.map(r => r.id) || [],
            };
            const response = await fetch(`http://127.0.0.1:8000/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `user`, updated.id, 1)
            toast.success(`User updated successfully! ID: ${selectedUser.id}`);
            setUsers(prev => prev.map(user => (user.id === updated.id ? updated : user)));
            setSelectedUser(null);
        } catch (err: any) {
            toast.error(`Error updating user: ${err.message}`);
        }
    }

    // delete user
    async function handleDelete(userId: number) {
        if (userId <= 0) return
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `user`, userId, 1)
            toast.success(`User deleted successfully! ID: ${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err: any) {
            toast.error(`Error deleting user: ${err.message}`);
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
            <div className={selectedUser ? "col-md-12 col-lg-6" : "col-12"}>
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
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>E-mail</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.roles.map(role => (<span key={role.id}>{role.name}</span>))}</td>
                                        <td>{user.is_active ? "Active" : "Inactive"}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button onClick={(e) => handleModify(e,user)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDelete(user.id)}>
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
                                onClick={() => setSelectedUser({ username: "", email: "", password: "", is_active: true })}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedUser && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedUser.id ? "Modify User" : "Add New User"}</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedUser.id ? handleUpdate : handleCreate}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="username"
                                        value={selectedUser.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Roles:</label>
                                </div>
                                <div className="col-8">
                                    <select
                                    className="form-select border border-2 border-dark"
                                    size={3}
                                    name="roles"
                                    multiple
                                    value={selectedUser.roles?.map(r => r.id.toString()) || []} // <-- convert IDs to strings
                                    onChange={(e) => {
                                        const options = Array.from(e.target.selectedOptions);
                                        const selectedRoles = options.map(
                                        o => roles.find(r => r.id === parseInt(o.value))! // <-- convert back to number
                                        );
                                        setSelectedUser(prev => ({ ...prev, roles: selectedRoles }));
                                    }}
                                    >
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id.toString()}> {/* <-- string value */}
                                        {role.name}
                                        </option>
                                    ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row my-3">
                                <div className="col-4">
                                    <label htmlFor="statusSelect">Status:</label>
                                </div>

                                <div className="col-8">
                                    <select
                                    id="statusSelect"
                                    className="form-select border border-2 border-dark"
                                    value={selectedUser.is_active ? "active" : "inactive"}
                                    onChange={(e) =>
                                        setSelectedUser({
                                        ...selectedUser,
                                        is_active: e.target.value === "active",
                                        })
                                    }
                                    >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Email:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="email"
                                        value={selectedUser.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Password:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="password"
                                        type="password"
                                        value={selectedUser.password || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-6">
                                </div>
                                <div className="col-3">
                                    <button type="submit" className="btn btn-success w-100">
                                        {selectedUser.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedUser(null)}>Cancel</button>
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

export default UserManagement;