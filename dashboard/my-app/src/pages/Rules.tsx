import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

const PAGE_LIMIT = 10;

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

    // fetch rules
    const fetchRules = useCallback(async (skip: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/rules/?skip=${skip}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error("Failed to fetch rules");
            const data: Rule[] = await res.json();
            setRules(data);
            setHasMore(data.length === PAGE_LIMIT);
            setPage(skip);
        } catch (err: any) {
            toast.error(`Error fetching rules: ${err.message}`);
        }
    }, []);

    useEffect(() => {
        fetchRules(0);
    }, [fetchRules]);

    // handle next page
    const handleNext = () => {
        if (!hasMore) return;
        fetchRules(page + PAGE_LIMIT);
    };

    // handle prev page
    const handlePrev = () => {
        if (page <= 0) return;
        fetchRules(Math.max(page - PAGE_LIMIT, 0));
    };

    // handle modify form
    const handleModify = (e: React.MouseEvent<HTMLButtonElement>, rule: Rule) => {
        e.preventDefault()
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

    // handle input change (rule fields)
    const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.preventDefault()
        const { name } = e.target;
        setSelectedRule(prev => {
            if (!prev) return prev;
            if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                return {...prev,[name]: e.target.checked,};
            }
            return {...prev,[name]: e.target.value,};
        });
    };

    // handle input change (condition fields)
    const handleConditionChange = (index: number,e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.preventDefault()
        const { name, value } = e.target;
        setSelectedRule(prev => {
            if (!prev) return prev;
            const updatedConditions = [...prev.conditions];
            updatedConditions[index] = {...updatedConditions[index],[name]: value,};
            return {...prev,conditions: updatedConditions,};
        });
    };

    // add condition field
    const addCondition = () => {
        setSelectedRule(prev => {
            if (!prev) return prev;
            return {...prev,
                conditions: [...prev.conditions,
                    { field: "", operator: "", value: "" },
                ],
            };
        });
    };

    // remove condition field
    const removeCondition = (index: number) => {
        setSelectedRule(prev => {
            if (!prev) return prev;
            return {...prev,
                conditions: prev.conditions.filter((_, i) => i !== index),
            };
        });
    };

    // create rule
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRule) return;
        if (!window.confirm("Are you sure you want to create this rule?")) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/rules/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedRule),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const created = await response.json();
            handleLog(`create`, `rule`, created.id, 1)
            toast.success(`Rule created successfully! ID: ${created.id}`);
            setSelectedRule(null);
        } catch (err: any) {
            toast.error(`Error creating rule: ${err.message}`);
        }
    }

    // update rule
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRule?.id) return;
        if (!window.confirm("Are you sure you want to update this rule?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/rules/${selectedRule.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedRule),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            const updated = await response.json();
            handleLog(`update`, `rule`, updated.id, 1)
            toast.success(`Rule updated successfully! ID: ${selectedRule.id}`);
            setRules(prev => prev.map(rule => (rule.id === updated.id ? updated : rule)));
            setSelectedRule(null);
        } catch (err: any) {
            toast.error(`Error updating rule: ${err.message}`);
        }
    }

    // delete rule
    async function handleDelete(ruleId: number) {
        if (ruleId <= 0) return
        if (!window.confirm("Are you sure you want to delete this rule?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/rules/${ruleId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Unexpected HTTP status; request may be unsuccessful");
            }
            handleLog(`update`, `rule`, ruleId, 1)
            toast.success(`Rule deleted successfully! ID: ${ruleId}`);
            setRules(prev => prev.filter(rule => rule.id !== ruleId));
        } catch (err: any) {
            toast.error(`Error deleting rule: ${err.message}`);
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
                <h5>Rules Management</h5>
            </div>
            <div className={selectedRule ? "col-md-12 col-lg-6" : "col-12"}>
                <div className="card h-100">
                    <h5 className="card-title card_title">Rules</h5>
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
                                                <ul className="mb-0 ps-3 list-unstyled">
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
                                        <td className="action-block">
                                            <button className="blue_b p-1" onClick={(e) => handleModify(e,rule)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="mx-2 red_b p-1" onClick={() => handleDelete(rule.id)}>
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
                                onClick={() => setSelectedRule({ id: 0, name: "", description: "", severity:"", enabled:true, conditions: []})}
                            >Add Rule</button>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn blue_b w-100" disabled={!hasMore} onClick={() => handleNext()}>Next</button>
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
                        src="src/assets/banner_green.png"
                        alt="Card image"
                        className="img-fluid"
                    />

                    <div className="card-body">
                        <form
                            onSubmit={selectedRule?.id ? handleUpdate : handleCreate}
                        >

                            {/* Rule Name */}
                            <div className="row mb-2">
                                <div className="col-4">
                                    <label>Name:</label>
                                </div>
                                <div className="col-8">
                                    <input
                                        className="rounded border border-2 border-dark text-light bg-dark w-100"
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
                                        className="rounded border border-2 border-dark text-light bg-dark w-100"
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
                                        className="rounded border border-2 border-dark text-light bg-dark w-100"
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
                                                className="rounded border border-2 border-dark text-light bg-dark w-100"
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
                                                className="rounded border border-2 border-dark text-light bg-dark w-100"
                                                name="operator"
                                                value={cond.operator}
                                                onChange={(e) =>
                                                    handleConditionChange(index, e)
                                                }
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="eq">eq</option>
                                                <option value="neq">neq</option>
                                                <option value="lt">lt</option>
                                                <option value="lte">lte</option>
                                                <option value="gt">gt</option>
                                                <option value="gte">gte</option>
                                                <option value="contains">contains</option>
                                                <option value="startswith">startswith</option>
                                                <option value="endswith">endswith</option>
                                                <option value="count_gte">count_gte</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-4">
                                            <label>Value</label>
                                        </div>
                                        <div className="col-8">
                                            <input
                                                className="rounded border border-2 border-dark text-light bg-dark w-100"
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
                                        className="btn green_b w-100"
                                    >
                                        {selectedRule?.id ? "Save" : "Create"}
                                    </button>
                                </div>
                                <div className="col-3">
                                    <button
                                        type="button"
                                        className="btn blue_b w-100"
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