import { EventGraphs } from "../components/EventGraph";
import { AssetChart } from "../components/AssetChart";
import { IncidentsTable } from "../components/AlertTable";
import { EventPie } from "../components/EventSeverity";
import { AlertPie } from "../components/AlertSeverity";

function Home() {
    return (
        <div className="row content g-2">
            <div className="col-12 d-flex justify-content-start">
                <h5>Security Posture : Past ◀ 24 ▶ Hours</h5>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Event Graph</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <EventGraphs />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Active Assets</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <AssetChart />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Incidents</h5>
                    <img src="src/assets/banner_red.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <IncidentsTable />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Severity Distribution</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-6">
                                <EventPie />
                            </div>
                            <div className="col-6">
                                <AlertPie />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default Home;
