import React from 'react';
import { Organization } from '../types';

interface OrganizationsProps {
  organizations: Organization[];
  onViewDetails?: (organization: Organization) => void;
}

const Organizations: React.FC<OrganizationsProps> = ({ organizations, onViewDetails }) => {
  const formatWebsite = (website?: string) => {
    if (!website) return null;
    return website.startsWith('http') ? website : `https://${website}`;
  };

  return (
    <div className="p-8">
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-secondary/30">
            <tr>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Name</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Industry</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Website</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Phone</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-medium">{org.name}</td>
                <td className="p-4 text-text-secondary">{org.industry || 'N/A'}</td>
                <td className="p-4 text-text-secondary">
                  {org.website ? (
                    <a
                      href={formatWebsite(org.website) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {org.website}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="p-4 text-text-secondary">{org.phone || 'N/A'}</td>
                <td className="p-4">
                    <button
                      className="text-primary hover:underline text-sm"
                      onClick={() => onViewDetails?.(org)}
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

export default Organizations;
