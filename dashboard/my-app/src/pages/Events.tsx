import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function EventManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
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

    // fetch events
    const fetchEvents = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/events/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch events");
            const data: Event[] = await res.json();
            setEvents(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching events: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchEvents(0);
    }, [fetchEvents]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchEvents(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchEvents(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, event: Event) => {
        e.preventDefault()
        setSelectedEvent({
            id: event.id,
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            asset_id: event.asset.id,
        });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        e.preventDefault()
        const { name, value, dataset } = e.target
        const parsed = dataset.type === "number" ? value === "" ? null : Number(value) : value
        setSelectedEvent(prev => ({ ...prev!, [name]: parsed, }))
    }

    // create event
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this event?")) return;
        if (!selectedEvent) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/events/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedEvent),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `event`, created.id, 1)
            toast.success(`Event created successfully! ID: ${created.id}`);
            setSelectedEvent(null);
        } catch (err: any) {
            toast.error(`Error creating event: ${err.message}`);
        }
    }
    
    // update event
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEvent?.id) return;
        if (!window.confirm("Are you sure you want to update this event?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/events/${selectedEvent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedEvent),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `event`, updated.id, 1)
            toast.success(`Event updated successfully! ID: ${selectedEvent.id}`);
            setEvents(prev => prev.map(event => (event.id === updated.id ? updated : event)));
            setSelectedEvent(null);
        } catch (err: any) {
            toast.error(`Error updating event: ${err.message}`);
        }
    }

    // delete event
    async function handleDelete(eventId: number) {
        if (eventId <= 0) return
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/events/${eventId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `event`, eventId, 1)
            toast.success(`Event deleted successfully! ID: ${eventId}`);
            setEvents(prev => prev.filter(event => event.id !== eventId));
        } catch (err: any) {
            toast.error(`Error deleting event: ${err.message}`);
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
                <h5>Event Management</h5>
            </div>
            <div className={selectedEvent ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">Events</h5>
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
                                        <td className="action-block">
                                            <button className="blue_b p-1" onClick={(e) => handleModify(e,event)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 red_b p-1" onClick={() => handleDelete(event.id)}>
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
                            <button type="button" className="btn blue_b w-100" disabled={page === 0} onClick={() => handlePrev()}>Previous</button>
                        </div>
                        <div className="col-3">
                            <button
                                className="btn green_b w-100"
                                onClick={() => setSelectedEvent({ event_type: "", severity: "", message: "", asset_id: null,})}
                            >Add Event</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn blue_b w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedEvent && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedEvent.id ? "Modify Event" : "Add New Event"}</h5>
                    <img src="src/assets/banner_red.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedEvent.id ? handleUpdate : handleCreate}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Event Type:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                    <button type="submit" className="btn green_b w-100">
                                        {selectedEvent.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn blue_b w-100" onClick={() => setSelectedEvent(null)}>Cancel</button>
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