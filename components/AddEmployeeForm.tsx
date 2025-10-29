import React, { useState } from 'react';
import { Employee } from '../types';

interface AddEmployeeFormProps {
  onAdd: (employee: Omit<Employee, 'id'>) => void;
  onClose: () => void;
  onUpdate?: (employee: Employee) => void;
  initialEmployee?: Employee | null;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onAdd, onClose, onUpdate, initialEmployee }) => {
  const [fullName, setFullName] = useState(initialEmployee?.fullName ?? '');
  const [jobTitle, setJobTitle] = useState(initialEmployee?.jobTitle ?? '');
  const [phone, setPhone] = useState(initialEmployee?.phone ?? '');

  React.useEffect(() => {
    setFullName(initialEmployee?.fullName ?? '');
    setJobTitle(initialEmployee?.jobTitle ?? '');
    setPhone(initialEmployee?.phone ?? '');
  }, [initialEmployee?.id]);

  const isEditing = Boolean(initialEmployee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !jobTitle) return;

    if (isEditing && initialEmployee && onUpdate) {
      onUpdate({ ...initialEmployee, fullName, jobTitle, phone });
    } else {
      onAdd({ fullName, jobTitle, phone });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-text-secondary">Full Name</label>
        <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-text-secondary">Job Title</label>
        <input type="text" id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Phone (Optional)</label>
        <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">
          {isEditing ? 'Update Employee' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
};

export default AddEmployeeForm;
