import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

function AssetManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [assets, setAssets] = useState<Asset[]>([]);
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

    // fetch assets
    const fetchAssets = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/assets/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch assets");
            const data: Asset[] = await res.json();
            setAssets(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching assets: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchAssets(0);
    }, [fetchAssets]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchAssets(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchAssets(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, asset: Asset) => {
        e.preventDefault()
        setSelectedAsset({ ...asset });
    };

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        e.preventDefault()
        if (!selectedAsset) return
        const { name, value, dataset } = e.target
        const parsed = dataset.type === "number" ? value === "" ? null : Number(value) : value
        setSelectedAsset(prev => ({ ...prev!, [name]: parsed, }))
    }

    // create asset
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to create this asset?")) return;
        if (!selectedAsset) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/assets/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAsset),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `asset`, created.id, 1)
            toast.success(`Asset created successfully! ID: ${created.id}`);
            setSelectedAsset(null);
        } catch (err: any) {
            toast.error(`Error creating asset: ${err.message}`);
        }
    }

    // update asset
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAsset?.id) return;
        if (!window.confirm("Are you sure you want to update this asset?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/assets/${selectedAsset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedAsset),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `asset`, updated.id, 1)
            toast.success(`Asset updated successfully! ID: ${selectedAsset.id}`);
            setAssets(prev => prev.map(asset => (asset.id === updated.id ? updated : asset)));
            setSelectedAsset(null);
        } catch (err: any) {
            toast.error(`Error updating asset: ${err.message}`);
        }
    }

    // delete asset
    async function handleDelete(assetId: number) {
        if (assetId <= 0) return
        if (!window.confirm("Are you sure you want to delete this asset?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/assets/${assetId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `asset`, assetId, 1)
            toast.success(`Asset deleted successfully! ID: ${assetId}`);
            setAssets(prev => prev.filter(asset => asset.id !== assetId));
        } catch (err: any) {
            toast.error(`Error deleting asset: ${err.message}`);
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
                <h5>Asset Management</h5>
            </div>
            <div className={selectedAsset ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">Assets</h5>
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
                                        <td className="action-block">
                                            <button className="blue_b p-1" onClick={(e) => handleModify(e,asset)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 red_b p-1" onClick={() => handleDelete(asset.id)}>
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
                                onClick={() => setSelectedAsset({ name: "", asset_type: "", ip_address: "", hostname: "", environment: "" })}
                            >Add Asset</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn blue_b w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedAsset && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">{selectedAsset.id ? "Modify Asset" : "Add New Asset"}</h5>
                    <img src="src/assets/banner_green.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <form onSubmit={selectedAsset.id ? handleUpdate : handleCreate}>

                            <div className="row">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                        className="rounded border border-2 border-dark text-light bg-dark"
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
                                    <button type="submit" className="btn green_b w-100">
                                        {selectedAsset.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button type="button" className="btn blue_b w-100" onClick={() => setSelectedAsset(null)}>Cancel</button>
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