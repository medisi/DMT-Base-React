import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { getNameDatabase } from "../../api";

const defaultSettings = {
    theme: 'light',
    colorScheme: 'orange',
    fontFamily: 'Roboto',
    fontSize: '16',
    language: 'ru',
    blurBg: 'noblur',
    invertTextHeader: 'no-inverted',
    panelVisible: 'visible'
};

// Загрузка настроек из localStorage
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('userSettings'));
    return settings ? settings : defaultSettings;
};

// Применение настроек
const applySettings = (settings) => {
};

const NameDatabase = () => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    
    const lang = settings.language;
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nameBase, setNameBase] = useState('');

    useEffect(() => {
            
          const fetchProjects = async () => {
            if (!token) {
              setError('Not authenticated. Please log in.');
              setLoading(false);
              return;
            }
    
            try {
                const data = await getNameDatabase(token);
                setNameBase(data.name);
            } catch (err) {
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
          };
    
          fetchProjects();
        }, [token]);
        if (loading) return <div>{lang === 'ru' ? ' ' : ' '}</div>;
        if (error) return <div style={{ color: 'red' }}></div>;

    return (
        <div className="sidebar-name-dataBase styled-subtext">{nameBase}</div>
    );
};
export default NameDatabase;