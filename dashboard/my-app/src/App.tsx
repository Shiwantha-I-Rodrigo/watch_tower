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
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>

        <div className="sidebar pt-5">
            <h2 className='pb-3'><b>WATCH TOWER</b></h2>
            <img src="src/assets/profile.png" className="rounded-circle profile"></img>
            <div className="p-4 text-start">
            <a href="/" className="pb-3"><i className="bi bi-speedometer"></i>&nbsp;&nbsp;Dashboard</a>
            <a href="/users" className="pb-3"><i className="bi bi-person-circle"></i>&nbsp;&nbsp;Users</a>
            <a href="/roles" className="pb-3"><i className="bi bi-patch-question-fill"></i>&nbsp;&nbsp;Roles</a>
            <a href="/assets" className="pb-3"><i className="bi bi-coin"></i>&nbsp;&nbsp;Assets</a>
            <a href="/events" className="pb-3"><i className="bi bi-heart-pulse-fill"></i>&nbsp;&nbsp;Events</a>
            <a href="/logs" className="pb-3"><i className="bi bi-browser-safari"></i>&nbsp;&nbsp;Logs</a>
            <a href="/rules" className="pb-3"><i className="bi bi-brilliance"></i>&nbsp;&nbsp;Rules</a>
            <a href="/alerts" className="pb-3"><i className="bi bi-bullseye"></i>&nbsp;&nbsp;Alerts</a>
            <a href="/incidents" className="pb-3"><i className="bi bi-exclamation-circle"></i>&nbsp;&nbsp;Incidents</a>
            <a href="/audits" className="pb-3"><i className="bi bi-check-circle-fill"></i>&nbsp;&nbsp;Audits</a>
            </div>
            <img src="src/assets/logo.png" className="rounded-circle logo"></img>
        </div>

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
