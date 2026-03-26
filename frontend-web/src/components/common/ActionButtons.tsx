import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

export const EditButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Edit',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <PencilIcon className="h-4 w-4" />
  </button>
);

export const DeleteButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Delete',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <TrashIcon className="h-4 w-4" />
  </button>
);

export const ViewButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'View',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <EyeIcon className="h-4 w-4" />
  </button>
);

export const ApproveButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Approve',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <CheckIcon className="h-4 w-4" />
  </button>
);

export const RejectButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Reject',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <XMarkIcon className="h-4 w-4" />
  </button>
);

export const RefreshButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Refresh',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <ArrowPathIcon className="h-4 w-4" />
  </button>
);

interface AddButtonProps extends ActionButtonProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  disabled = false,
  tooltip = 'Add',
  label = 'Add',
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];

  const variantClasses = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`inline-flex items-center gap-2 ${sizeClasses} font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${className}`}
    >
      <PlusIcon className="h-4 w-4" />
      {label}
    </button>
  );
};

interface ActionButtonGroupProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  disableEdit?: boolean;
  disableDelete?: boolean;
  disableView?: boolean;
  disableApprove?: boolean;
  disableReject?: boolean;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  disableEdit = false,
  disableDelete = false,
  disableView = false,
  disableApprove = false,
  disableReject = false,
  className = '',
}) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {onView && <ViewButton onClick={onView} disabled={disableView} />}
    {onEdit && <EditButton onClick={onEdit} disabled={disableEdit} />}
    {onApprove && <ApproveButton onClick={onApprove} disabled={disableApprove} />}
    {onReject && <RejectButton onClick={onReject} disabled={disableReject} />}
    {onDelete && <DeleteButton onClick={onDelete} disabled={disableDelete} />}
  </div>
);

export default ActionButtonGroup;
