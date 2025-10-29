import React, { useState } from 'react';
import { Organization } from '../types';

interface AddOrganizationFormProps {
  onAdd: (org: Omit<Organization, 'id' | 'createdAt' | 'descriptionEmbedding'>) => void;
  onClose: () => void;
}

const AddOrganizationForm: React.FC<AddOrganizationFormProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, industry, website, phone, address, description });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Organization Name</label>
        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-text-secondary">Industry</label>
        <input type="text" id="industry" value={industry} onChange={e => setIndustry(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-text-secondary">Website</label>
          <input type="text" id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="example.com" className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Phone</label>
          <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-text-secondary">Address</label>
        <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">Add Organization</button>
      </div>
    </form>
  );
};

export default AddOrganizationForm;
