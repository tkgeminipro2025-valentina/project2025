import React, { useState } from 'react';
import { Deal, Contact, DealStage } from '../types';
import KanbanColumn from './KanbanColumn';
import { DEAL_STAGES_ORDER } from '../constants';

interface DealsProps {
  deals: Deal[];
  contacts: Contact[];
  updateDealStage: (dealId: string, newStage: DealStage) => void;
  isReadOnly?: boolean;
}

const Deals: React.FC<DealsProps> = ({ deals, contacts, updateDealStage, isReadOnly = false }) => {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dealId: string) => {
    if (isReadOnly) {
      return;
    }
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: DealStage) => {
    e.preventDefault();
    if (isReadOnly) {
      return;
    }
    if (draggedDealId) {
        updateDealStage(draggedDealId, stage);
        setDraggedDealId(null);
    }
  };

  return (
    <div className="p-8 h-full flex overflow-x-auto">
      <div className="flex space-x-6 h-full">
        {DEAL_STAGES_ORDER.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={deals.filter(d => d.stage === stage)}
            contacts={contacts}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );
};

export default Deals;
