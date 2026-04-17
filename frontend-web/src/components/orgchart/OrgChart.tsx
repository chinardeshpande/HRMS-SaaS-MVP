import { OrgChartNode, OrgChartEmployee } from './OrgChartNode';

interface OrgChartProps {
  employees: OrgChartEmployee[];
  showApprovalChain?: boolean;
  onNodeClick?: (employee: OrgChartEmployee) => void;
}

const OrgChartTree = ({
  employee,
  showApprovalChain,
  onNodeClick,
}: {
  employee: OrgChartEmployee;
  showApprovalChain?: boolean;
  onNodeClick?: (employee: OrgChartEmployee) => void;
}) => {
  const hasDirectReports = employee.directReports && employee.directReports.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Employee Node */}
      <OrgChartNode
        employee={employee}
        showApprovalChain={showApprovalChain}
        onNodeClick={onNodeClick}
      />

      {/* Direct Reports */}
      {hasDirectReports && (
        <>
          {/* Compact Horizontal Line */}
          {employee.directReports!.length > 1 && (
            <div
              className="relative h-4"
              style={{
                width: `${(employee.directReports!.length - 1) * 200}px`,
              }}
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gray-300"></div>
            </div>
          )}

          {/* Compact Direct Reports Container */}
          <div className="flex justify-center gap-4 pt-4">
            {employee.directReports!.map((report) => (
              <div key={report.employeeId} className="relative">
                {/* Compact vertical connector */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-px h-4 bg-gray-300"></div>

                {/* Recursive render */}
                <OrgChartTree
                  employee={report}
                  showApprovalChain={showApprovalChain}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const OrgChart = ({ employees, showApprovalChain, onNodeClick }: OrgChartProps) => {
  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-sm text-gray-500">No organizational data available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
      <div className="inline-flex flex-col items-center min-w-full justify-center">
        {employees.map((employee) => (
          <div key={employee.employeeId} className="mb-4">
            <OrgChartTree
              employee={employee}
              showApprovalChain={showApprovalChain}
              onNodeClick={onNodeClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
