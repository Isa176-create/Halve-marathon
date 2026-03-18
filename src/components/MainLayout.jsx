import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Schedule from './Schedule';
import Profile from './Profile';

const MainLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'schedule' && <Schedule />}
                {activeTab === 'profile' && <Profile />}
            </div>

            {/* Bottom Navigation */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderTop: '1px solid var(--glass-border)',
                    padding: '0.75rem 0',
                    display: 'flex',
                    justifyContent: 'space-around',
                    backdropFilter: 'blur(10px)',
                    zIndex: 100,
                    maxWidth: '480px',
                    margin: '0 auto'
                }}
            >
                <button
                    onClick={() => setActiveTab('dashboard')}
                    style={{
                        background: 'none', border: 'none',
                        color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-tertiary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', fontWeight: activeTab === 'dashboard' ? 600 : 400, cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>🏠</span>
                    Home
                </button>

                <button
                    onClick={() => setActiveTab('schedule')}
                    style={{
                        background: 'none', border: 'none',
                        color: activeTab === 'schedule' ? 'var(--primary)' : 'var(--text-tertiary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', fontWeight: activeTab === 'schedule' ? 600 : 400, cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>📅</span>
                    Schema
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                        background: 'none', border: 'none',
                        color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-tertiary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', fontWeight: activeTab === 'profile' ? 600 : 400, cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>👤</span>
                    Profiel
                </button>
            </div>
        </div>
    );
};

export default MainLayout;
