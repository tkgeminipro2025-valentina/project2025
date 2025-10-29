import React from 'react';
import { Contact, Deal, Project, Organization, DealStage, ProjectStatus } from '../types';

interface DashboardProps {
  organizations: Organization[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
}

const StatCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <div className="bg-surface rounded-lg p-6 border border-border">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        <p className="text-xs text-text-secondary mt-2">{description}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ organizations, contacts, deals, projects }) => {
    const totalOrganizations = organizations.length;
    const totalPipelineValue = deals
      .filter(d => d.stage !== DealStage.Won && d.stage !== DealStage.Lost)
      .reduce((sum, deal) => sum + (deal.amount || 0), 0).toLocaleString();
    const openDeals = deals.filter(d => d.stage === DealStage.New || d.stage === DealStage.Quoting).length;
    const activeProjects = projects.filter(p => p.status === ProjectStatus.Running).length;
    
    const recentActivity = [
        ...deals.slice(0, 2).map(d => ({ type: 'New Deal', text: `${d.dealName} for $${(d.amount || 0).toLocaleString()}`})),
        ...contacts.slice(0, 2).map(c => ({ type: 'New Contact', text: `${c.fullName}`})),
        ...organizations.slice(0,1).map(o => ({ type: 'New Organization', text: o.name}))
    ].sort(() => Math.random() - 0.5).slice(0, 5);
    
    const runningProjects = projects.filter(p => p.status === 'running').slice(0, 5);

    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Organizations" value={totalOrganizations.toString()} description="All companies in the system" />
                <StatCard title="Pipeline Value" value={`$${totalPipelineValue}`} description="Value of deals in progress" />
                <StatCard title="Open Deals" value={openDeals.toString()} description="Deals not yet closed" />
                <StatCard title="Active Projects" value={activeProjects.toString()} description="Projects currently running" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface rounded-lg p-6 border border-border">
                    <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                    <ul className="space-y-4">
                        {recentActivity.map((activity, i) => (
                             <li key={i} className="flex items-center">
                                <div className="h-3 w-3 bg-primary rounded-full mr-4"></div>
                                <div>
                                    <p className="font-semibold text-sm">{activity.type}</p>
                                    <p className="text-xs text-text-secondary">{activity.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-surface rounded-lg p-6 border border-border">
                    <h3 className="font-bold text-lg mb-4">Active Projects</h3>
                     <ul className="space-y-4">
                        {runningProjects.map((project) => (
                             <li key={project.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">{project.projectName}</p>
                                    <p className="text-xs text-text-secondary">Ends: {project.endDate}</p>
                                </div>
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">
                                    {project.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
