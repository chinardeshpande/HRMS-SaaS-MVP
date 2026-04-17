import { UserIcon, EnvelopeIcon, BriefcaseIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export interface OrgChartEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  designation?: { name: string };
  department?: { name: string };
  profilePictureUrl?: string;
  managerId?: string;
  directReports?: OrgChartEmployee[];
  isCurrentUser?: boolean;
  isInApprovalChain?: boolean;
  approvalLevel?: number;
}

interface OrgChartNodeProps {
  employee: OrgChartEmployee;
  showApprovalChain?: boolean;
  onNodeClick?: (employee: OrgChartEmployee) => void;
}

export const OrgChartNode = ({ employee, showApprovalChain, onNodeClick }: OrgChartNodeProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(employee);
    } else {
      navigate(`/employees/${employee.employeeId}`);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Compact Employee Card */}
      <div
        onClick={handleClick}
        className={`
          relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer
          border p-2.5 w-[180px]
          ${employee.isCurrentUser ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}
          ${employee.isInApprovalChain ? 'ring-1 ring-orange-400' : ''}
        `}
      >
        {/* Current User Badge */}
        {employee.isCurrentUser && (
          <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            YOU
          </div>
        )}

        {/* Approval Level Badge */}
        {showApprovalChain && employee.isInApprovalChain && employee.approvalLevel !== undefined && (
          <div className="absolute -top-2 -left-2 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
            {employee.approvalLevel}
          </div>
        )}

        {/* Compact Layout */}
        <div className="flex items-center space-x-2 mb-1.5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {employee.profilePictureUrl ? (
              <img
                src={employee.profilePictureUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {employee.firstName.charAt(0)}
                  {employee.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">
              {employee.firstName} {employee.lastName}
            </h4>
          </div>
        </div>

        {/* Designation & Department - Compact */}
        <div className="space-y-0.5 text-[10px] text-gray-600">
          {employee.designation && (
            <p className="truncate font-medium">{employee.designation.name}</p>
          )}
          {employee.department && (
            <p className="truncate text-gray-500">{employee.department.name}</p>
          )}
        </div>
      </div>

      {/* Compact Connector Line */}
      {employee.directReports && employee.directReports.length > 0 && (
        <div className="w-px h-4 bg-gray-300"></div>
      )}
    </div>
  );
};
