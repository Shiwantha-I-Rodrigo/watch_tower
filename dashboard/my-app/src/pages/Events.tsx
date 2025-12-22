import React, { useEffect, useState } from "react";

function Events() {
    const [events, setEvent] = useState<Event[]>([]);
    const [selectedEvent, setselectedEvent] = useState<Event | null>(null);

    type Event = {
        id: number;
        name: string;
        email: string;
    };

    // Fetch events on load
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => res.json())
            .then(data => setEvent(data))
            .catch(err => console.error("Error fetching events:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (event: Event) => {
        setselectedEvent({ ...event }); // clone event into form state
    };

    // Handle form input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setselectedEvent(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name as keyof Event]: value
            };
        });
    };

    // Submit updated event
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedEvent) return;

        fetch(`https://dummyjson.com/events/${selectedEvent.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedEvent)
        })
            .then(res => res.json())
            .then((updatedEvent: Event) => {
                setEvent(prevEvents =>
                    prevEvents.map(u =>
                        u.id === updatedEvent.id ? updatedEvent : u
                    )
                );
                setselectedEvent(null);
            })
            .catch(err => console.error("Error updating event:", err));
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>Event Management</h2>
            </div>
            <div className={selectedEvent ? "col-md-12 col-lg-6" : "col-12"}>
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
                                {events.map(event => (
                                    <tr key={event.id}>
                                        <td>{event.id}</td>
                                        <td>{event.name}</td>
                                        <td>{event.email}</td>
                                        <td>{event.email}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(event)}>
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

            {selectedEvent && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">Event Alerts</h5>
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
                                        value={selectedEvent.name}
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
                                        value={selectedEvent.email}
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
                                        value={selectedEvent.email}
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
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setselectedEvent(null)}>Cancel</button>
                                </div>

                            </div>

                        </form>
                    </div>
                </div>
            </div>)}


        </div>
    )
}

export default Events;