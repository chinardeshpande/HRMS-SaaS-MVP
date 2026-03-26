import React, { useState, useEffect } from 'react';

interface AssetReturn {
  assetId?: string;
  assetType: string;
  assetName: string;
  assetTag?: string;
  condition: 'good' | 'fair' | 'damaged' | 'lost';
  returnDate?: string;
  verifiedBy?: string;
  remarks?: string;
  isReturned: boolean;
}

interface AssetReturnFormProps {
  asset?: AssetReturn;
  onSubmit: (data: Partial<AssetReturn>) => void;
  isSubmitting?: boolean;
}

export const AssetReturnForm: React.FC<AssetReturnFormProps> = ({
  asset,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<AssetReturn>>({
    assetType: '',
    assetName: '',
    assetTag: '',
    condition: 'good',
    returnDate: '',
    verifiedBy: '',
    remarks: '',
    isReturned: false,
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        assetType: asset.assetType,
        assetName: asset.assetName,
        assetTag: asset.assetTag || '',
        condition: asset.condition,
        returnDate: asset.returnDate || '',
        verifiedBy: asset.verifiedBy || '',
        remarks: asset.remarks || '',
        isReturned: asset.isReturned,
      });
    }
  }, [asset]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type *
          </label>
          <select
            name="assetType"
            value={formData.assetType}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">Select asset type</option>
            <option value="laptop">Laptop</option>
            <option value="desktop">Desktop Computer</option>
            <option value="monitor">Monitor</option>
            <option value="keyboard">Keyboard</option>
            <option value="mouse">Mouse</option>
            <option value="headset">Headset</option>
            <option value="mobile">Mobile Phone</option>
            <option value="tablet">Tablet</option>
            <option value="id_card">ID Card</option>
            <option value="access_card">Access Card</option>
            <option value="books">Books/Materials</option>
            <option value="keys">Keys</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Name *
          </label>
          <input
            type="text"
            name="assetName"
            value={formData.assetName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., MacBook Pro 14, Dell Monitor"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asset Tag / Serial Number
        </label>
        <input
          type="text"
          name="assetTag"
          value={formData.assetTag}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Asset tag or serial number"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition *
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Return Date
          </label>
          <input
            type="date"
            name="returnDate"
            value={formData.returnDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verified By
        </label>
        <input
          type="text"
          name="verifiedBy"
          value={formData.verifiedBy}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name of person who verified the return"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Remarks
        </label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any notes about the asset condition or return"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isReturned"
          checked={formData.isReturned}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isSubmitting}
        />
        <label className="ml-2 block text-sm text-gray-700">
          Mark as returned
        </label>
      </div>

      {formData.condition === 'damaged' || formData.condition === 'lost' ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> Assets marked as damaged or lost may result in deductions
            from final settlement. Please provide detailed remarks.
          </p>
        </div>
      ) : null}
    </form>
  );
};
