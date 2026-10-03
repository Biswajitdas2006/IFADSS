export default function SeverityBadge({ severity }) {
  const severityClass = (severity || '').toLowerCase();

  return (
    <span className={`sev-badge sev-${severityClass}`}>
      {severity}
    </span>
  );
}
