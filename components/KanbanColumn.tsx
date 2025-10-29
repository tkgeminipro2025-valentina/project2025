import React from 'react';
import { Deal, DealStage, Contact } from '../types';

interface KanbanCardProps {
    deal: Deal;
    contact?: Contact;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, dealId: string) => void;
    isReadOnly: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ deal, contact, onDragStart, isReadOnly }) => (
    <div
        draggable={!isReadOnly}
        onDragStart={isReadOnly ? undefined : (e) => onDragStart(e, deal.id)}
        className={`bg-surface p-4 rounded-lg border border-border mb-4 ${isReadOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
    >
        <h4 className="font-bold">{deal.dealName}</h4>
        <p className="text-sm text-text-secondary mt-1">{contact?.fullName || 'Unknown Contact'}</p>
        <p className="text-lg font-bold text-primary mt-2">${(deal.amount || 0).toLocaleString()}</p>
        <p className="text-xs text-text-secondary mt-1">Close Date: {deal.closeDate}</p>
    </div>
);


interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  contacts: Contact[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, dealId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: DealStage) => void;
  isReadOnly?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals, contacts, onDragStart, onDrop, isReadOnly = false }) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

  return (
    <div
      className="flex-1 min-w-[300px] bg-background rounded-lg p-4"
      onDragOver={isReadOnly ? undefined : handleDragOver}
      onDrop={isReadOnly ? undefined : (e) => onDrop(e, stage)}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg capitalize">{stage} ({deals.length})</h3>
        <p className="text-sm font-semibold text-text-secondary">${totalValue.toLocaleString()}</p>
      </div>
      <div className="h-full">
        {deals.map(deal => {
          const contact = contacts.find(c => c.id === deal.contactId);
          return <KanbanCard key={deal.id} deal={deal} contact={contact} onDragStart={onDragStart} isReadOnly={isReadOnly} />;
        })}
      </div>
    </div>
  );
};

export default KanbanColumn;
