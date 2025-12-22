import React, { useEffect, useState } from "react";

function Rules() {

      const [rules, setRules] = useState<Rules[]>([]);
      const [selectedRule, setselectedRule] = useState<Rules | null>(null);
  
      type Rules = {
          id: number;
          name: string;
          email: string;
      };
  
      // Fetch rules on load
      useEffect(() => {
          fetch("https://jsonplaceholder.typicode.com/users")
              .then(res => res.json())
              .then(data => setRules(data))
              .catch(err => console.error("Error fetching rules:", err));
      }, []);
  
      // Handle Modify button click
      const handleModifyClick = (rule: Rules) => {
          setselectedRule({ ...rule }); // clone rule into form state
      };
  
      // Handle form input change
      const handleChange = (
          e: React.ChangeEvent<HTMLInputElement>) => {
          const { name, value } = e.target;
  
          setselectedRule(prev => {
              if (!prev) return prev;
  
              return {
                  ...prev,
                  [name as keyof Rules]: value
              };
          });
      };
  
      // Submit updated rule
      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
  
          if (!selectedRule) return;
  
          fetch(`https://dummyjson.com/users/${selectedRule.id}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify(selectedRule)
          })
              .then(res => res.json())
              .then((updatedRule: Rules) => {
                  setRules(prevRules =>
                      prevRules.map(u =>
                          u.id === updatedRule.id ? updatedRule : u
                      )
                  );
                  setselectedRule(null);
              })
              .catch(err => console.error("Error updating rule:", err));
      };
  
      return (
          <div className="row content g-4">
  
              <div className="col-12 d-flex justify-content-start">
                  <h2>Rules Management</h2>
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
                                      <th>Role</th>
                                      <th>Status</th>
                                      <th>Modify</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {rules.map(rule => (
                                      <tr key={rule.id}>
                                          <td>{rule.id}</td>
                                          <td>{rule.name}</td>
                                          <td>{rule.email}</td>
                                          <td>{rule.email}</td>
                                          <td>
                                              <button onClick={() => handleModifyClick(rule)}>
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
  
              {selectedRule && (<div className="col-md-12 col-lg-6">
                  <div className="card h-100">
  
                      <h5 className="card-title card_title">Rules Alerts</h5>
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
                                          value={selectedRule.name}
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
                                          value={selectedRule.email}
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
                                          value={selectedRule.email}
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
                                      <button type="button" className="btn btn-primary w-100" onClick={() => setselectedRule(null)}>Cancel</button>
                                  </div>
  
                              </div>
  
                          </form>
                      </div>
                  </div>
              </div>)}
  
  
          </div>
      )

}

export default Rules;