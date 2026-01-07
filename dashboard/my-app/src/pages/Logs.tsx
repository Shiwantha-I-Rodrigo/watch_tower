import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [page, setPage] = useState(0);

    type User = {
        id: number;
        title: string;
        description: string;
        category: string;
        price: number;
        discountPercentage: number;
        rating: number;
        stock: number;
    };

    // Fetch users on load
    useEffect(() => {
        fetch("https://dummyjson.com/products?limit=10&skip=0")
            .then(res => res.json())
            .then(data => setUsers(data.products))
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

        if (confirm("Are you sure you want to update this?")){

        fetch(`https://dummyjson.com/products/${selectedUser.id}`, {
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
                toast.success("User Updated!");
            })
            .catch(err => console.error("Error updating user:", err));
        }
    };

    // Handle next page
    const handleNext = () => {

        setPage(p => p + 10)
        console.log(page);

        fetch(`https://dummyjson.com/products?limit=10&skip=${page + 10}`)
            .then(res => res.json())
            .then(data => setUsers(data.products))
            .catch(err => console.error("Error fetching users:", err));
    };

    // Handle prev page
    const handlePrev = () => {

        if (page >= 10){
            setPage(p => p - 10)
        }
        console.log(page);

        fetch(`https://dummyjson.com/products?limit=10&skip=${page - 10}`)
            .then(res => res.json())
            .then(data => setUsers(data.products))
            .catch(err => console.error("Error fetching users:", err));
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
                                        <td>{user.title}</td>
                                        <td>User</td>
                                        <td>Active</td>
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
                            <button type="button" className="btn btn-primary w-100" onClick={() => handlePrev()}>Previous</button>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Reset</a>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedUser && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">Modify User</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        name="title"
                                        value={selectedUser.title}
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
                                        name="category"
                                        value={selectedUser.category}
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
                                        name="price"
                                        value={selectedUser.price}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Username:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        name="rating"
                                        value={selectedUser.rating}
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
                                        name="password"
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

        <ToastContainer />
        </div>
    )
}

export default UserManagement;