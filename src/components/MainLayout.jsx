import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Schedule from './Schedule';
import Profile from './Profile';
import StravaConnect from './StravaConnect';

const StravaIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#FC4C02' : 'currentColor'}>
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
);

const MainLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'schedule' && <Schedule />}
                {activeTab === 'strava' && <StravaConnect />}
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
                    onClick={() => setActiveTab('strava')}
                    style={{
                        background: 'none', border: 'none',
                        color: activeTab === 'strava' ? '#FC4C02' : 'var(--text-tertiary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', fontWeight: activeTab === 'strava' ? 600 : 400, cursor: 'pointer'
                    }}
                >
                    <StravaIcon active={activeTab === 'strava'} />
                    Strava
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
