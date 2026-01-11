import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserForm | null>(null);
    const [page, setPage] = useState(0);
    const [roles, setRoles] = useState<Role[]>([]);
    const [hasMore, setHasMore] = useState(true);

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

    // Fetch users on load
    useEffect(() => {
        fetch("http://127.0.0.1:8000/users/?skip=0&limit=10")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Error fetching users:", err));
        fetch("http://127.0.0.1:8000/roles")
            .then(res => res.json())
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (user: User) => {
        setSelectedUser({ ...user }); // clone user into form state
    };

    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        setSelectedUser(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name]: type === "checkbox" ? checked : value
            };
        });
    };

    // Create user
    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedUser) return;

        if (!confirm("Are you sure you want to create this user?")) return;

       const payload = {
            username: selectedUser!.username,
            email: selectedUser!.email,
            is_active: selectedUser!.is_active,
            password: selectedUser!.password,
            role_ids: selectedUser.roles?.map(r => r.id) || [],
        };

        fetch("http://127.0.0.1:8000/users/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create user");
                }
                return res.json();
            })
            .then((newUser: User) => {
                setUsers(prev => [...prev, newUser]);
                toast.success("User created!");
                setSelectedUser(null);
            })
            .catch(err => {
                console.error("Error creating user:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated user
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (!confirm("Are you sure you want to update this?")) return;

        const payload = {
            username: selectedUser.username,
            email: selectedUser.email,
            is_active: selectedUser.is_active,
            // password: newPassword, // only if changing password
            role_ids: selectedUser.roles?.map(r => r.id) || [],
        };

        fetch(`http://127.0.0.1:8000/users/${selectedUser.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update user");
                }
                return res.json();
            })
            .then((updatedUser: User) => {
                setUsers(prevUsers =>
                    prevUsers.map(u =>
                        u.id === updatedUser.id ? updatedUser : u
                    )
                );
                toast.success("User updated!");
            })
            .catch(err => {
                console.error("Error updating user:", err);
                toast.error("Update failed");
            });
    };

    // delete user
    const handleDeleteUser = (userId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        fetch(`http://127.0.0.1:8000/users/${userId}`, {
            method: "DELETE",
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to delete user");
                }

                // Remove user from local state
                setUsers(prevUsers =>
                    prevUsers.filter(user => user.id !== userId)
                );

                toast.success("User deleted!");
            })
            .catch(err => {
                console.error("Error deleting user:", err);
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

            setUsers(data);
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

            setUsers(data);
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
                                            <button onClick={() => handleModifyClick(user)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDeleteUser(user.id)}>
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
                        <form onSubmit={selectedUser.id ? handleSubmit : handleCreateUser}>

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