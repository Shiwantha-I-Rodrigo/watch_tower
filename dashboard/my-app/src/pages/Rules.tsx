import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

function RuleManagement() {
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [rules, setRules] = useState<Rule[]>([]);
    const [selectedRule, setSelectedRule] = useState<RuleForm | null>(null);

    type RuleCondition = {
        id: number;
        field: string;
        operator: string;
        value: string;
    };

    type Rule = {
        id: number;
        name: string;
        description: string;
        severity: string;
        enabled: boolean;
        conditions: RuleCondition[];
    };

    type RuleConditionForm = {
        id?: number;
        field: string;
        operator: string;
        value: string;
    };

    type RuleForm = {
        id?: number;
        name: string;
        description: string;
        severity: string;
        enabled: boolean;
        conditions: RuleConditionForm[];
    };

    // Fetch rules on load
    useEffect(() => {
        fetch("http://127.0.0.1:8000/rules/?skip=0&limit=50")
            .then(res => res.json())
            .then(data => setRules(data))
            .catch(err => console.error("Error fetching rules:", err));
    }, []);

    // Handle Modify button click
    const handleModifyClick = (rule: Rule) => {
        setSelectedRule({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            enabled: rule.enabled,
            conditions: rule.conditions.map(c => ({
                id: c.id,
                field: c.field,
                operator: c.operator,
                value: c.value,
            })),
        });
    };

    // Handle form input change (rule fields)
    const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target;

        setSelectedRule(prev => {
            if (!prev) return prev;

            // Checkbox handling (safe narrowing)
            if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                return {
                    ...prev,
                    [name]: e.target.checked,
                };
            }

            return {
                ...prev,
                [name]: e.target.value,
            };
        });
    };


    // Handle condition field change
    const handleConditionChange = (index: number,e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setSelectedRule(prev => {
            if (!prev) return prev;

            const updatedConditions = [...prev.conditions];
            updatedConditions[index] = {
                ...updatedConditions[index],
                [name]: value,
            };

            return {
                ...prev,
                conditions: updatedConditions,
            };
        });
    };

    // add condition field
    const addCondition = () => {
        setSelectedRule(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                conditions: [
                    ...prev.conditions,
                    { field: "", operator: "", value: "" },
                ],
            };
        });
    };

    // remove condition field
    const removeCondition = (index: number) => {
        setSelectedRule(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                conditions: prev.conditions.filter((_, i) => i !== index),
            };
        });
    };

    // Create rule
    const handleCreateRule = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedRule) return;

        if (!confirm("Are you sure you want to create this rule?")) return;

        const payload = {
            name: selectedRule.name,
            description: selectedRule.description,
            severity: selectedRule.severity,
            enabled: selectedRule.enabled,
            conditions: selectedRule.conditions.map(c => ({
                field: c.field,
                operator: c.operator,
                value: c.value,
            })),
        };

        fetch("http://127.0.0.1:8000/rules/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to create rule");
                }
                return res.json();
            })
            .then((newRule: Rule) => {
                setRules(prev => [...prev, newRule]);
                toast.success("Rule created!");
                setSelectedRule(null);
            })
            .catch(err => {
                console.error("Error creating rule:", err);
                toast.error("Create failed");
            });
    };

    // Submit updated rule
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedRule || !selectedRule.id) return;

        if (!confirm("Are you sure you want to update this rule?")) return;

        const payload = {
            name: selectedRule.name,
            description: selectedRule.description,
            severity: selectedRule.severity,
            enabled: selectedRule.enabled,
            conditions: selectedRule.conditions.map(c => ({
                field: c.field,
                operator: c.operator,
                value: c.value,
            })),
        };

        fetch(`http://127.0.0.1:8000/rules/${selectedRule.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to update rule");
                }
                return res.json();
            })
            .then((updatedRule: Rule) => {
                setRules(prevRules =>
                    prevRules.map(r =>
                        r.id === updatedRule.id ? updatedRule : r
                    )
                );
                toast.success("Rule updated!");
            })
            .catch(err => {
                console.error("Error updating rule:", err);
                toast.error("Update failed");
            });
    };

    // Delete rule
    const handleDeleteRule = (ruleId: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        fetch(`http://127.0.0.1:8000/rules/${ruleId}`, {
            method: "DELETE",
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to delete rule");
                }

                // Remove rule from local state
                setRules(prevRules =>
                    prevRules.filter(rule => rule.id !== ruleId)
                );

                toast.success("Rule deleted!");
            })
            .catch(err => {
                console.error("Error deleting rule:", err);
                toast.error("Delete failed");
            });
    };


    // Handle next page
    const handleNext = async () => {
        try {
            const nextPage = page + 10;

            const res = await fetch(
            `http://127.0.0.1:8000/rules/?skip=${nextPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) {
            console.log("No more rules");
            setHasMore(false);
            return;
            }

            setRules(data);
            setPage(nextPage);
        } catch (err) {
            console.error("Error fetching rules:", err);
        }
    };

    // Handle prev page
    const handlePrev = async () => {
        if (page <= 0) return;

        const prevPage = Math.max(page - 10, 0);

        try {
            const res = await fetch(
            `http://127.0.0.1:8000/rules/?skip=${prevPage}&limit=10`
            );
            const data = await res.json();

            if (!data || data.length === 0) return;

            setRules(data);
            setHasMore(true);
            setPage(prevPage);
        } catch (err) {
            console.error("Error fetching rules:", err);
        }
    };

    return (
        <div className="row content g-4">

            <div className="col-12 d-flex justify-content-start">
                <h2>User Management</h2>
            </div>
            <div className={selectedRule ? "col-md-12 col-lg-6" : "col-12"}>
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
                                    <th>Severity</th>
                                    <th>Description</th>
                                    <th>Enabled</th>
                                    <th>Conditions</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td>{rule.id}</td>
                                        <td>{rule.name}</td>
                                        <td>{rule.severity}</td>
                                        <td>{rule.description}</td>
                                        <td>
                                            {rule.enabled ? (
                                                <span className="text-success">Yes</span>
                                            ) : (
                                                <span className="text-danger">No</span>
                                            )}
                                        </td>
                                        <td>
                                            {rule.conditions.length === 0 ? (
                                                <em>No conditions</em>
                                            ) : (
                                                <ul className="mb-0 ps-3">
                                                    {rule.conditions.map(cond => (
                                                        <li key={cond.id}>
                                                            <strong>{cond.field}</strong>{" "}
                                                            {cond.operator}{" "}
                                                            <em>{cond.value}</em>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleModifyClick(rule)}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="mx-2 bg-danger"
                                                onClick={() => handleDeleteRule(rule.id)}
                                                title="Delete"
                                            >
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
                                onClick={() => setSelectedRule({ id: 0, name: "", description: "", severity:"", enabled:true, conditions: []})}
                            >Add User</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedRule && (<div className="col-md-12 col-lg-6">
                <div className="card h-100">

                    <h5 className="card-title card_title">
                        {selectedRule?.id ? "Modify Rule" : "Add New Rule"}
                    </h5>

                    <img
                        src="src/assets/banner_blue.png"
                        alt="Card image"
                        className="img-fluid"
                    />

                    <div className="card-body">
                        <form
                            onSubmit={selectedRule?.id ? handleSubmit : handleCreateRule}
                        >

                            {/* Rule Name */}
                            <div className="row mb-2">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="name"
                                        value={selectedRule?.name ?? ""}
                                        onChange={handleRuleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Severity */}
                            <div className="row mb-2">
                                <div className="col-4">
                                    <label>Severity:</label>
                                </div>
                                <div className="col-8">
                                    <select
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="severity"
                                        value={selectedRule?.severity ?? ""}
                                        onChange={handleRuleChange}
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="row mb-2">
                                <div className="col-4">
                                    <label>Description:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded text-dark bg-light border border-2 border-dark w-100"
                                        name="description"
                                        value={selectedRule?.description ?? ""}
                                        onChange={handleRuleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Enabled */}
                            <div className="row mb-3">
                                <div className="col-4">
                                    <label>Enabled:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        type="checkbox"
                                        name="enabled"
                                        checked={selectedRule?.enabled ?? false}
                                        onChange={handleRuleChange}
                                    />
                                </div>
                            </div>

                            <hr />

                            {/* Conditions */}
                            <h6>Conditions</h6>

                            {selectedRule?.conditions.map((cond, index) => (
                                <div key={index} className="border rounded p-2 mb-2">

                                    <div className="row mb-2">
                                        <div className="col-4">
                                            <label>Field</label>
                                        </div>
                                        <div className="col-8">
                                            <input
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="field"
                                                value={cond.field}
                                                onChange={(e) =>
                                                    handleConditionChange(index, e)
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-4">
                                            <label>Operator</label>
                                        </div>
                                        <div className="col-8">
                                            <select
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="operator"
                                                value={cond.operator}
                                                onChange={(e) =>
                                                    handleConditionChange(index, e)
                                                }
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="=">=</option>
                                                <option value="!=">!=</option>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value="contains">contains</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-4">
                                            <label>Value</label>
                                        </div>
                                        <div className="col-8">
                                            <input
                                                className="rounded text-dark bg-light border border-2 border-dark w-100"
                                                name="value"
                                                value={cond.value}
                                                onChange={(e) =>
                                                    handleConditionChange(index, e)
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() => removeCondition(index)}
                                    >
                                        Remove Condition
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="btn btn-sm btn-secondary mb-3"
                                onClick={addCondition}
                            >
                                + Add Condition
                            </button>

                            {/* Actions */}
                            <div className="row">
                                <div className="col-6" />
                                <div className="col-3">
                                    <button
                                        type="submit"
                                        className="btn btn-success w-100"
                                    >
                                        {selectedRule?.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button
                                        type="button"
                                        className="btn btn-primary w-100"
                                        onClick={() => setSelectedRule(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
            )}

        <ToastContainer />
        </div>
    )
}

export default RuleManagement;