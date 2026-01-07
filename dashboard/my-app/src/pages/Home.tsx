import { EventTrend } from "../components/EventTrend";
import { SeverityPie } from "../components/SeverityPie";
import { TopSources } from "../components/TopSources";
import { AlertsTable } from "../components/AlertsTable";
import { eventTrend, severityData, topSources, alerts } from "../data/mockData";

function Home() {
    return (
        <div className="row content g-2">
            <div className="col-12 d-flex justify-content-start">
                <h2>Home</h2>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Event Graph</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <EventTrend data={eventTrend} />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Asset Activity</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <TopSources data={topSources} />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Alerts</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <AlertsTable alerts={alerts} />
                    </div>
                    <div className="card-body row justify-content-center">
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Previous</button>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Reset</a>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Next</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Severity Distribution</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <SeverityPie data={severityData} />
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">User Activity</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <AlertsTable alerts={alerts} />
                    </div>
                    <div className="card-body row justify-content-center">
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Previous</button>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Reset</a>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Next</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-lg-6">
                <div className="card h-100">
                    <h5 className="card-title card_title">Events</h5>
                    <img src="src/assets/banner_blue.png" alt="Card image" className="img-fluid"></img>
                    <div className="card-body">
                        <AlertsTable alerts={alerts} />
                    </div>
                    <div className="card-body row justify-content-center">
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Previous</button>
                        </div>
                        <div className="col-3">
                                <a href="#" className="btn btn-primary w-100">Reset</a>
                        </div>
                        <div className="col-3">
                            <button type="button" className="btn btn-primary w-100" >Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default Home;
