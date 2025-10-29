import React, { useState } from 'react';
import { Contact, ContactStatus, Organization } from '../types';

interface AddContactFormProps {
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  organizations: Organization[];
}

const AddContactForm: React.FC<AddContactFormProps> = ({ onAddContact, onClose, organizations }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '');
  const [status, setStatus] = useState<ContactStatus>(ContactStatus.Lead);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    onAddContact({
      fullName,
      email,
      phone,
      title,
      organizationId,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-text-secondary">Full Name</label>
        <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Phone</label>
        <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-secondary">Title</label>
        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="organizationId" className="block text-sm font-medium text-text-secondary">Organization</label>
        <select id="organizationId" value={organizationId} onChange={e => setOrganizationId(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-secondary">Status</label>
        <select id="status" value={status} onChange={e => setStatus(e.target.value as ContactStatus)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {Object.values(ContactStatus).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">Add Contact</button>
      </div>
    </form>
  );
};

export default AddContactForm;
