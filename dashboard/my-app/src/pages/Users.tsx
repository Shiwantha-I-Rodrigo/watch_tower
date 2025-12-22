import React, { useEffect, useState } from "react";

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    type User = {
        id: number;
        name: string;
        email: string;
    };

    // Fetch users on load
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Error fetching users:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (user: User) => {
        setSelectedUser({ ...user }); // clone user into form state
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSelectedUser(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name as keyof User]: value
            };
        });
    };

    // Submit updated user
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedUser) return;

        fetch(`https://dummyjson.com/users/${selectedUser.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedUser)
        })
            .then(res => res.json())
            .then((updatedUser: User) => {
                setUsers(prevUsers =>
                    prevUsers.map(u =>
                        u.id === updatedUser.id ? updatedUser : u
                    )
                );
                setSelectedUser(null);
            })
            .catch(err => console.error("Error updating user:", err));
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
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(user)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="card-body row justify-content-center">
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Previous</a>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Refresh</a>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Next</a>
                        </div>
                    </div>
                </div>
            </div>

            {selectedUser && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">User Alerts</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        name="name"
                                        value={selectedUser.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Role:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        name="email"
                                        value={selectedUser.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Status:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        name="status"
                                        value={selectedUser.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-6">
                                </div>
                                <div className="col-3">
                                    <button type="submit" className="btn btn-primary w-100">Save</button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedUser(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}


        </div>
    )
}

export default UserManagement;