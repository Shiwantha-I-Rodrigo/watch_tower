import type { Alert } from "../data/mockData";

export const AlertsTable = ({ alerts }: { alerts: Alert[] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th>Time</th>
        <th>Severity</th>
        <th>Source</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      {alerts.map(alert => (
        <tr key={alert.id}>
          <td>{alert.timestamp}</td>
          <td>{alert.severity}</td>
          <td>{alert.source}</td>
          <td>{alert.message}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
