import React, { useEffect, useState } from "react";

function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedAlert, setselectedAlert] = useState<Alert | null>(null);

    type Alert = {
        id: number;
        name: string;
        email: string;
    };

    // Fetch alerts on load
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => res.json())
            .then(data => setAlerts(data))
            .catch(err => console.error("Error fetching alerts:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (alert: Alert) => {
        setselectedAlert({ ...alert }); // clone alert into form state
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setselectedAlert(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name as keyof Alert]: value
            };
        });
    };

    // Submit updated alert
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedAlert) return;

        fetch(`https://dummyjson.com/alerts/${selectedAlert.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedAlert)
        })
            .then(res => res.json())
            .then((updatedAlert: Alert) => {
                setAlerts(prevAlerts =>
                    prevAlerts.map(u =>
                        u.id === updatedAlert.id ? updatedAlert : u
                    )
                );
                setselectedAlert(null);
            })
            .catch(err => console.error("Error updating alert:", err));
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>Alert Management</h2>
            </div>
            <div className={selectedAlert ? "col-md-12 col-lg-6" : "col-12"}>
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
                                {alerts.map(alert => (
                                    <tr key={alert.id}>
                                        <td>{alert.id}</td>
                                        <td>{alert.name}</td>
                                        <td>{alert.email}</td>
                                        <td>{alert.email}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(alert)}>
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

            {selectedAlert && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">Alert Alerts</h5>
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
                                        value={selectedAlert.name}
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
                                        value={selectedAlert.email}
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
                                        value={selectedAlert.email}
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
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setselectedAlert(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}


        </div>
    )
}

export default Alerts;