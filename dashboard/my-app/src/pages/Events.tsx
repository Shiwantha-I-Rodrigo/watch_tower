import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function EventManagement() {
    const [page, setPage] = useState(0);
    const [events, setEvents] = useState<Event[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventForm | null>(null);

    type Asset = {
        id: number;
        name: string;
        asset_type: string;
        ip_address: string;
        hostname: string;
        environment: string;
    };

    type Event = {
        id: number;
        event_type: string;
        severity: string;
        message: string;
        timestamp: string;
        asset: Asset;
    };

    type EventForm = {
        id?: number;
        event_type: string;
        severity: string;
        message: string;
        asset_id: number | null;
    };

    // Fetch events on load
    useEffect(() => {
        fetch("http://127.0.0.1:8000/events/?skip=0&limit=10")
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(err => console.error("Error fetching events:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (event: Event) => {
        setSelectedEvent({
            id: event.id,
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            asset_id: event.asset.id,
        });
    };

    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setSelectedEvent(prev => {
            if (!prev) return prev;

            // Handle numeric nullable fields
            if (name === "asset_id") {
                return {
                    ...prev,
                    asset_id: value === "" ? null : Number(value),
                };
            }

            return {
                ...prev,
                [name]: value,
            };
        });
    };

    // Create event
    const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedEvent) return;

        if (!confirm("Are you sure you want to create this event?")) return;

       const payload = {
            event_type: selectedEvent!.event_type,
            severity: selectedEvent!.severity,
            message: selectedEvent!.message,
            asset_id: selectedEvent!.asset_id
        };

        fetch("http://127.0.0.1:8000/events/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create event");
                }
                return res.json();
            })
            .then((newEvent: Event) => {
                setEvents(prev => [...prev, newEvent]);
                toast.success("User created!");
                setSelectedEvent(null);
            })
            .catch(err => {
                console.error("Error creating event:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated event
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedEvent) return;

        if (!confirm("Are you sure you want to update this?")) return;

        const payload = {
            event_type: selectedEvent.event_type,
            severity: selectedEvent.severity,
            message: selectedEvent.message,
            asset_id: selectedEvent.asset_id
        };

        fetch(`http://127.0.0.1:8000/events/${selectedEvent.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update event");
                }
                return res.json();
            })
            .then((updatedEvent: Event) => {
                setEvents(prevEvents =>
                    prevEvents.map(u =>
                        u.id === updatedEvent.id ? updatedEvent : u
                    )
                );
                toast.success("Event updated!");
            })
            .catch(err => {
                console.error("Error updating event:", err);
                toast.error("Update failed");
            });
    };

    // delete event
    const handleDeleteEvent = (eventId: number) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        fetch(`http://127.0.0.1:8000/events/${eventId}`, {
            method: "DELETE",
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to delete event");
                }

                // Remove event from local state
                setEvents(prevEvents =>
                    prevEvents.filter(event => event.id !== eventId)
                );

                toast.success("Event deleted!");
            })
            .catch(err => {
                console.error("Error deleting event:", err);
                toast.error("Delete failed");
            });
    };

    // Handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
            `http://127.0.0.1:8000/events/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
            console.log("No more events");
            setHasMore(false);
            return;
            }

            setEvents(data);
            setPage(nextPage);
        } catch (err) {
            console.error("Error fetching events:", err);
        }
    };

    // Handle prev page
    const handlePrev = async () => {
        if (page <= 0) return;

        const prevPage = Math.max(page - 10, 0);

        try {
            const res = await fetch(
            `http://127.0.0.1:8000/events/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setEvents(data);
            setHasMore(true);
            setPage(prevPage);
        } catch (err) {
            console.error("Error fetching events:", err);
        }
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>User Management</h2>
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
                                    <th>Event Type</th>
                                    <th>Severity</th>
                                    <th>Message</th>
                                    <th>Asset ID</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event.id}>
                                        <td>{event.id}</td>
                                        <td>{event.event_type}</td>
                                        <td>{event.severity}</td>
                                        <td>{event.message}</td>
                                        <td>{event.asset.id}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(event)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDeleteEvent(event.id)}>
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
                                onClick={() => setSelectedEvent({ event_type: "", severity: "", message: "", asset_id: null,})}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedEvent && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedEvent.id ? "Modify User" : "Add New User"}</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedEvent.id ? handleSubmit : handleCreateEvent}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Event Type:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="event_type"
                                        value={selectedEvent.event_type}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Severity:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="severity"
                                        value={selectedEvent.severity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Message:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="message"
                                        value={selectedEvent.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Asset ID:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="asset_id"
                                        value={selectedEvent.asset_id ?? ""}
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
                                        {selectedEvent.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedEvent(null)}>Cancel</button>
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

export default EventManagement;