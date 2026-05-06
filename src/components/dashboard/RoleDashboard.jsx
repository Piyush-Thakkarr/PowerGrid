import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from '../../pages/Dashboard';
import DiscomDashboard from '../../pages/DiscomDashboard';
import GovernmentDashboard from '../../pages/GovernmentDashboard';
import GridDashboard from '../../pages/GridDashboard';

export default function RoleDashboard() {
    const { user } = useAuth();
    const role = user?.role || 'consumer';

    if (role === 'discom') return <DiscomDashboard />;
    if (role === 'government') return <GovernmentDashboard />;
    if (role === 'grid_operator') return <GridDashboard />;
    return <Dashboard />;
}
