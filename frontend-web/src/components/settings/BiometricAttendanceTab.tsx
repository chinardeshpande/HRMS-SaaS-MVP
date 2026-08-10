import { useEffect, useState } from 'react';
import attendanceService, { BiometricImportConfig } from '../../services/attendanceService';

const fields: Array<[keyof BiometricImportConfig['columnMapping'], string]> = [
  ['employeeCode', 'Employee code'], ['date', 'Attendance date'], ['status', 'Status'],
  ['checkIn', 'Check-in'], ['checkOut', 'Check-out'], ['workMinutes', 'Work minutes'],
  ['location', 'Location'], ['notes', 'Notes'],
];

export default function BiometricAttendanceTab() {
  const [config, setConfig] = useState<BiometricImportConfig | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    attendanceService.getImportConfig().then(setConfig).catch((error) => setMessage(error.message));
  }, []);

  if (!config) return <p className="text-sm text-gray-500">{message || 'Loading biometric format…'}</p>;

  const save = async () => {
    try {
      setConfig(await attendanceService.saveImportConfig(config));
      setMessage('Biometric attendance format saved. Preview an import before committing it.');
    } catch (error: any) {
      setMessage(error.message || 'Could not save format');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Biometric attendance import</h2>
        <p className="mt-1 text-sm text-gray-500">Map the column headings exported by your biometric system. CSV and XLSX monthly files are validated in dry-run before commit.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-gray-700">Format name
          <input className="input mt-1" value={config.formatName} onChange={(e) => setConfig({ ...config, formatName: e.target.value })} />
        </label>
        <label className="text-sm font-semibold text-gray-700">Header row
          <input className="input mt-1" type="number" min={1} max={25} value={config.headerRow} onChange={(e) => setConfig({ ...config, headerRow: Number(e.target.value) })} />
        </label>
        <label className="text-sm font-semibold text-gray-700">Excel sheet name (optional)
          <input className="input mt-1" value={config.sheetName || ''} onChange={(e) => setConfig({ ...config, sheetName: e.target.value || undefined })} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-sm font-semibold text-gray-700">{label} column
            <input className="input mt-1" value={config.columnMapping[key]} onChange={(e) => setConfig({ ...config, columnMapping: { ...config.columnMapping, [key]: e.target.value } })} />
          </label>
        ))}
      </div>
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
      <button className="btn btn-primary" onClick={save}>Save import format</button>
    </div>
  );
}
