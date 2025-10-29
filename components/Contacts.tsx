import React from 'react';
import { Contact, Organization } from '../types';

interface ContactsProps {
  contacts: Contact[];
  organizations: Organization[];
  onViewDetails?: (contact: Contact) => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, organizations, onViewDetails }) => {
  const getOrgName = (orgId?: string) => {
    return organizations.find(o => o.id === orgId)?.name || 'N/A';
  };

  const statusColorMap: { [key: string]: string } = {
    lead: 'bg-yellow-500/20 text-yellow-400',
    client: 'bg-green-500/20 text-green-400',
    student: 'bg-blue-500/20 text-blue-400',
    lost: 'bg-red-500/20 text-red-400',
    other: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="p-8">
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-secondary/30">
            <tr>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Full Name</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Email</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Phone</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Title</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Organization</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Status</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-medium">{contact.fullName}</td>
                <td className="p-4 text-text-secondary">{contact.email}</td>
                <td className="p-4 text-text-secondary">{contact.phone || 'N/A'}</td>
                <td className="p-4 text-text-secondary">{contact.title || 'N/A'}</td>
                <td className="p-4 text-text-secondary">{getOrgName(contact.organizationId)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${statusColorMap[contact.status]}`}>
                    {contact.status}
                  </span>
                </td>
                <td className="p-4">
                    <button
                      className="text-primary hover:underline text-sm"
                      onClick={() => onViewDetails?.(contact)}
                    >
                      View Details
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

export default Contacts;
