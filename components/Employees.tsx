import React from 'react';
import { Employee } from '../types';

interface EmployeesProps {
  employees: Employee[];
  onEdit?: (employee: Employee) => void;
  onViewDetails?: (employee: Employee) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onEdit, onViewDetails }) => {
  return (
    <div className="p-8">
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-secondary/30">
            <tr>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Full Name</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Job Title</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Phone</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-medium">{employee.fullName}</td>
                <td className="p-4 text-text-secondary">{employee.jobTitle}</td>
                <td className="p-4 text-text-secondary">{employee.phone || 'N/A'}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      className="text-primary hover:underline text-sm"
                      onClick={() => onViewDetails?.(employee)}
                    >
                      View
                    </button>
                    <button
                      className="text-primary hover:underline text-sm"
                      onClick={() => onEdit?.(employee)}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
