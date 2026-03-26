// Simple test page to verify Settings route works
export default function SettingsTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings Page Test</h1>
        <p className="text-gray-600 mb-4">
          If you can see this message, the Settings route is working correctly.
        </p>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-800 font-medium">✓ Route is accessible</p>
          <p className="text-green-700 text-sm mt-2">
            The issue might be with the ModernLayout or one of the tab components.
          </p>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open browser DevTools (F12)</li>
            <li>Check the Console tab for errors</li>
            <li>Check the Network tab for failed requests</li>
            <li>Look for any red error messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
