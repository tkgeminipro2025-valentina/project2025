import React, { useState } from 'react';
import { Deal, DealStage, Contact, Organization, Employee } from '../types';

interface AddDealFormProps {
  onAddDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  contacts: Contact[];
  organizations: Organization[];
  employees: Employee[];
}

const AddDealForm: React.FC<AddDealFormProps> = ({ onAddDeal, onClose, contacts, organizations, employees }) => {
  const [dealName, setDealName] = useState('');
  const [contactId, setContactId] = useState(contacts[0]?.id || '');
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '');
  const [assignedToEmployeeId, setAssignedToEmployeeId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [closeDate, setCloseDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName || !contactId || !organizationId || !amount || !closeDate) return;
    onAddDeal({
      dealName,
      contactId,
      organizationId,
      assignedToEmployeeId,
      amount: parseInt(amount, 10),
      stage: DealStage.New,
      closeDate
    });
  };

  return (
     <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="dealName" className="block text-sm font-medium text-text-secondary">Deal Name</label>
        <input type="text" id="dealName" value={dealName} onChange={e => setDealName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="organizationId" className="block text-sm font-medium text-text-secondary">Organization</label>
        <select id="organizationId" value={organizationId} onChange={e => setOrganizationId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="contactId" className="block text-sm font-medium text-text-secondary">Contact</label>
        <select id="contactId" value={contactId} onChange={e => setContactId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary">Amount ($)</label>
        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
       <div>
        <label htmlFor="assignedToEmployeeId" className="block text-sm font-medium text-text-secondary">Assigned To</label>
        <select id="assignedToEmployeeId" value={assignedToEmployeeId} onChange={e => setAssignedToEmployeeId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="closeDate" className="block text-sm font-medium text-text-secondary">Expected Close Date</label>
        <input type="date" id="closeDate" value={closeDate} onChange={e => setCloseDate(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">Add Deal</button>
      </div>
    </form>
  );
};

export default AddDealForm;
