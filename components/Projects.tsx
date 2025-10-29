import React from 'react';
import { Project, Organization, Employee } from '../types';

interface ProjectsProps {
  projects: Project[];
  organizations: Organization[];
  employees: Employee[];
  onViewDetails?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({
  projects,
  organizations,
  employees,
  onViewDetails,
  onDelete,
}) => {
    const getOrgName = (orgId?: string) => organizations.find(o => o.id === orgId)?.name || 'N/A';
    const getManagerName = (empId?: string) => employees.find(e => e.id === empId)?.fullName || 'N/A';

    const statusColorMap: { [key: string]: string } = {
        planning: 'bg-yellow-500/20 text-yellow-400',
        running: 'bg-blue-500/20 text-blue-400',
        completed: 'bg-green-500/20 text-green-400',
        on_hold: 'bg-gray-500/20 text-gray-400',
    };

  return (
    <div className="p-8">
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-secondary/30">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Project Name</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Organization</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Manager</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">End Date</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Status</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-4 font-medium">{project.projectName}</td>
                            <td className="p-4 text-text-secondary">{getOrgName(project.organizationId)}</td>
                            <td className="p-4 text-text-secondary">{getManagerName(project.managerEmployeeId)}</td>
                            <td className="p-4 text-text-secondary">{project.endDate}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${statusColorMap[project.status]}`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="p-4 space-x-3">
                                <button
                                    className="text-primary hover:underline text-sm"
                                    onClick={() => onViewDetails?.(project)}
                                >
                                    View
                                </button>
                                <button
                                    className="text-red-400 hover:text-red-200 text-sm"
                                    onClick={() => onDelete?.(project)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default Projects;
