import React, { useEffect, useState } from "react";

function Logs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [selectedLog, setselectedLog] = useState<Log | null>(null);

    type Log = {
        id: number;
        name: string;
        email: string;
    };

    // Fetch logs on load
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => res.json())
            .then(data => setLogs(data))
            .catch(err => console.error("Error fetching logs:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (log: Log) => {
        setselectedLog({ ...log }); // clone log into form state
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setselectedLog(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name as keyof Log]: value
            };
        });
    };

    // Submit updated log
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedLog) return;

        fetch(`https://dummyjson.com/logs/${selectedLog.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedLog)
        })
            .then(res => res.json())
            .then((updatedLog: Log) => {
                setLogs(prevLogs =>
                    prevLogs.map(u =>
                        u.id === updatedLog.id ? updatedLog : u
                    )
                );
                setselectedLog(null);
            })
            .catch(err => console.error("Error updating log:", err));
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>Log Management</h2>
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
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{log.name}</td>
                                        <td>{log.email}</td>
                                        <td>{log.email}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(log)}>
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

            {selectedLog && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">Log Alerts</h5>
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
                                        value={selectedLog.name}
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
                                        value={selectedLog.email}
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
                                        value={selectedLog.email}
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
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setselectedLog(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}


        </div>
    )
}

export default Logs;