import './App.css'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Users from "./pages/Users.tsx";
import Roles from "./pages/Roles.tsx";
import Assets from "./pages/Assets.tsx";
import Events from "./pages/Events.tsx";
import Logs from "./pages/Logs.tsx";
import Rules from "./pages/Rules.tsx";
import Alerts from "./pages/Alerts.tsx";
import Incidents from "./pages/Incidents.tsx";
import Audits from "./pages/Audits.tsx";

function App() {
  return (
    <BrowserRouter>

        <div className="sidebar">
            <h2>Admin</h2>
            <img src="src/assets/profile.png" className="rounded-circle profile"></img>
            <a href="#">Home</a>
            <a href="#">Users</a>
            <a href="#">Roles</a>
            <a href="#">Assets</a>
            <a href="#">Events</a>
            <a href="#">Logs</a>
            <a href="#">Rules</a>
            <a href="#">Alerts</a>
            <a href="#">Incidents</a>
            <a href="#">Audits</a>
        </div>

        <nav className="footer">
            <Link to="/">Home</Link> |{" "}
            <Link to="/users">Users</Link> |{" "}
            <Link to="/roles">Roles</Link> |{" "}
            <Link to="/assets">Assets</Link> |{" "}
            <Link to="/events">Events</Link> |{" "}
            <Link to="/logs">Logs</Link> |{" "}
            <Link to="/rules">Rules</Link> |{" "}
            <Link to="/alerts">Alerts</Link> |{" "}
            <Link to="/incidents">Incidents</Link> |{" "}
            <Link to="/audits">Audits</Link>
        </nav>

        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/events" element={<Events />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/audits" element={<Audits />} />
        </Routes>

    </BrowserRouter>
  );
}

export default App;
