import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function AssetManagement() {
    const [page, setPage] = useState(0);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<AssetForm | null>(null);

    type Asset = {
        id: number;
        name: string;
        asset_type: string;
        ip_address: string;
        hostname: string;
        environment: string;
    };

    type AssetForm = Partial<Asset>

    // Fetch assets on load
    useEffect(() => {
        fetch("http://127.0.0.1:8000/assets/?skip=0&limit=10")
            .then(res => res.json())
            .then(data => setAssets(data))
            .catch(err => console.error("Error fetching assets:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (asset: Asset) => {
        setSelectedAsset({ ...asset });
    };

    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSelectedAsset(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [name]: value
            };
        });
    };

    // Create asset
    const handleCreateAsset = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedAsset) return;

        if (!confirm("Are you sure you want to create this asset?")) return;

       const payload = {
            name: selectedAsset!.name,
            asset_type: selectedAsset!.asset_type,
            ip_address: selectedAsset!.ip_address,
            hostname: selectedAsset!.hostname,
            environment: selectedAsset!.environment
        };

        fetch("http://127.0.0.1:8000/assets/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create asset");
                }
                return res.json();
            })
            .then((newAsset: Asset) => {
                setAssets(prev => [...prev, newAsset]);
                toast.success("User created!");
                setSelectedAsset(null);
            })
            .catch(err => {
                console.error("Error creating user:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated asset
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAsset) return;

        if (!confirm("Are you sure you want to update this?")) return;

        const payload = {
            name: selectedAsset.name,
            asset_type: selectedAsset.asset_type,
            ip_address: selectedAsset.ip_address,
            hostname: selectedAsset.hostname,
            environment: selectedAsset.environment
        };

        fetch(`http://127.0.0.1:8000/assets/${selectedAsset.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update asset");
                }
                return res.json();
            })
            .then((updatedAsset: Asset) => {
                setAssets(prevAssets =>
                    prevAssets.map(u =>
                        u.id === updatedAsset.id ? updatedAsset : u
                    )
                );
                toast.success("Asset updated!");
            })
            .catch(err => {
                console.error("Error updating asset:", err);
                toast.error("Update failed");
            });
    };

    // delete asset
    const handleDeleteAsset = (assetId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        fetch(`http://127.0.0.1:8000/assets/${assetId}`, {
            method: "DELETE",
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to delete asset");
                }

                // Remove user from local state
                setAssets(prevAssets =>
                    prevAssets.filter(asset => asset.id !== assetId)
                );

                toast.success("User deleted!");
            })
            .catch(err => {
                console.error("Error deleting asset:", err);
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

            setAssets(data);
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

            setAssets(data);
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
            <div className={selectedAsset ? "col-md-12 col-lg-6" : "col-12"}>
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
                                    <th>Asset Type</th>
                                    <th>IP Address</th>
                                    <th>Hostname</th>
                                    <th>Environment</th>
                                    <th>Modify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(asset => (
                                    <tr key={asset.id}>
                                        <td>{asset.id}</td>
                                        <td>{asset.name}</td>
                                        <td>{asset.asset_type}</td>
                                        <td>{asset.ip_address}</td>
                                        <td>{asset.hostname}</td>
                                        <td>{asset.environment}</td>
                                        <td>
                                            <button onClick={() => handleModifyClick(asset)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 bg-danger" onClick={() => handleDeleteAsset(asset.id)}>
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
                                onClick={() => setSelectedAsset({ name: "", asset_type: "", ip_address: "", hostname: "", environment: "" })}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedAsset && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedAsset.id ? "Modify User" : "Add New User"}</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedAsset.id ? handleSubmit : handleCreateAsset}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="name"
                                        value={selectedAsset.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Asset Type:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="asset_type"
                                        value={selectedAsset.asset_type}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>IP Address:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="ip_address"
                                        value={selectedAsset.ip_address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Hostname:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="hostname"
                                        value={selectedAsset.hostname}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-4">
                                    <label>Environment:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark"
                                        name="environment"
                                        value={selectedAsset.environment}
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
                                        {selectedAsset.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn btn-primary w-100" onClick={() => setSelectedAsset(null)}>Cancel</button>
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

export default AssetManagement;