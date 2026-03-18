import React, { useState, useEffect } from 'react';

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate an API call to a weather service for Amsterdam
        const fetchWeather = async () => {
            setLoading(true);
            try {
                // In a real app, you'd use: 
                // fetch(`https://api.openweathermap.org/data/2.5/weather?q=Amsterdam&units=metric&appid=YOUR_API_KEY`)
                
                // For now, we simulate a realistic response
                // We'll vary it slightly based on the hour to make it feel "live"
                const hour = new Date().getHours();
                let temp = 12;
                let condition = 'Zonnig';
                let icon = '☀️';
                let advice = "Perfect weer voor een duurloop door het Vondelpark!";

                if (hour < 8 || hour > 20) {
                    temp = 8;
                    condition = 'Helder';
                    icon = '🌙';
                    advice = "Het is wat koeler; draag een extra laagje voor je warming-up.";
                } else if (hour > 12 && hour < 16) {
                    temp = 16;
                    condition = 'Licht Bewolkt';
                    icon = '⛅';
                    advice = "Lekker temperatuurtje! Vergeet je hydratatie niet.";
                }

                // Small delay to simulate network
                setTimeout(() => {
                    setWeather({ temp, condition, icon, advice, city: 'Amsterdam' });
                    setLoading(false);
                }, 800);

            } catch (error) {
                console.error("Fout bij ophalen weer:", error);
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: 'var(--space-3)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pulse" style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--text-tertiary)', opacity: 0.3 }}></div>
            </div>
        );
    }

    if (!weather) return null;

    // Determine color based on weather
    const isSunny = weather.condition === 'Zonnig' || weather.condition === 'Licht Bewolkt';
    const accentColor = isSunny ? 'var(--primary)' : 'var(--secondary)';
    const glowColor = isSunny ? 'rgba(245, 158, 11, 0.1)' : 'rgba(2, 132, 199, 0.1)';

    return (
        <div 
            className="glass-panel fade-in" 
            style={{ 
                padding: 'var(--space-4)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-4)',
                background: `linear-gradient(90deg, var(--bg-surface), ${glowColor})`,
                borderLeft: `4px solid ${accentColor}`
            }}
        >
            <div style={{ fontSize: '2.5rem' }}>{weather.icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Live in {weather.city}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{weather.temp}°C</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>
                    {weather.condition}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    <span style={{ marginRight: '4px' }}>🏃‍♂️</span> {weather.advice}
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
