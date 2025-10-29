import React from 'react';
import { Task, Deal, Contact, Project } from '../types';

interface TasksProps {
  tasks: Task[];
  deals: Deal[];
  contacts: Contact[];
  projects: Project[];
  onMarkDone?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, deals, contacts, projects, onMarkDone, onViewDetails, onDelete }) => {
  const getRelatedToInfo = (task: Task) => {
    if (!task.relatedTo) return 'N/A';
    switch (task.relatedTo.type) {
        case 'deal':
            return `Deal: ${deals.find(d => d.id === task.relatedTo?.id)?.dealName || 'Unknown'}`;
        case 'contact':
            return `Contact: ${contacts.find(c => c.id === task.relatedTo?.id)?.fullName || 'Unknown'}`;
        case 'project':
            return `Project: ${projects.find(p => p.id === task.relatedTo?.id)?.projectName || 'Unknown'}`;
        default:
            return 'N/A';
    }
  };
    
  return (
    <div className="p-8">
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-secondary/30">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Task</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Due Date</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Priority</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Status</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Related To</th>
                        <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-4 font-medium">{task.title}</td>
                            <td className="p-4 text-text-secondary">{task.dueDate}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                    task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                    task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}>
                                    {task.priority}
                                </span>
                            </td>
                             <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                    task.status === 'Done' ? 'bg-gray-500/20 text-gray-400' :
                                    task.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-purple-500/20 text-purple-400'
                                }`}>
                                    {task.status}
                                </span>
                            </td>
                            <td className="p-4 text-text-secondary">{getRelatedToInfo(task)}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        className="text-primary hover:underline text-sm disabled:text-text-secondary/60 disabled:cursor-not-allowed"
                                        disabled={task.status === 'Done'}
                                        onClick={() => onMarkDone?.(task)}
                                    >
                                        {task.status === 'Done' ? 'Completed' : 'Mark as Done'}
                                    </button>
                                    <button
                                        className="text-primary hover:underline text-sm"
                                        onClick={() => onViewDetails?.(task)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="text-red-400 hover:text-red-200 text-sm"
                                        onClick={() => onDelete?.(task)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default Tasks;
