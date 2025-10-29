import React, { useState } from 'react';
import { Project, Organization, Employee, ProjectStatus } from '../types';

interface AddProjectFormProps {
  onAdd: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  organizations: Organization[];
  employees: Employee[];
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onAdd, onClose, organizations, employees }) => {
  const [projectName, setProjectName] = useState('');
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '');
  const [managerEmployeeId, setManagerEmployeeId] = useState(employees[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !organizationId || !managerEmployeeId) return;
    onAdd({
      projectName,
      organizationId,
      managerEmployeeId,
      startDate,
      endDate,
      status: ProjectStatus.Planning,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-text-secondary">Project Name</label>
        <input type="text" id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="organizationId" className="block text-sm font-medium text-text-secondary">Organization</label>
        <select id="organizationId" value={organizationId} onChange={e => setOrganizationId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="managerEmployeeId" className="block text-sm font-medium text-text-secondary">Project Manager</label>
        <select id="managerEmployeeId" value={managerEmployeeId} onChange={e => setManagerEmployeeId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary">Start Date</label>
          <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary">End Date</label>
          <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">Add Project</button>
      </div>
    </form>
  );
};

export default AddProjectForm;
