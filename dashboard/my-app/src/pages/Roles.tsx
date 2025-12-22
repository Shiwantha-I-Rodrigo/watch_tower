import React, { useEffect, useState } from "react";

function Roles() {

    const [roles, setRoles] = useState<Roles[]>([]);
    const [selectedRole, setselectedRole] = useState<Roles | null>(null);

    type Roles = {
        id: number;
        name: string;
        email: string;
    };

    // Fetch roles on load
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => res.json())
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (role: Roles) => {
        setselectedRole({ ...role }); // clone role into form state
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setselectedRole(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name as keyof Roles]: value
            };
        });
    };

    // Submit updated role
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedRole) return;

        fetch(`https://dummyjson.com/roles/${selectedRole.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedRole)
        })
            .then(res => res.json())
            .then((updatedRole: Roles) => {
                setRoles(prevRoles =>
                    prevRoles.map(u =>
                        u.id === updatedRole.id ? updatedRole : u
                    )
                );
                setselectedRole(null);
            })
            .catch(err => console.error("Error updating role:", err));
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>Roles Management</h2>
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
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td>{role.id}</td>
                                        <td>{role.name}</td>
                                        <td>{role.email}</td>
                                        <td>{role.email}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(role)}>
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

            {selectedRole && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">Roles Alerts</h5>
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
                                        value={selectedRole.name}
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
                                        value={selectedRole.email}
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
                                        value={selectedRole.email}
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
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setselectedRole(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}


        </div>
    )

}


export default Roles;