import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { getNameUserHome } from "../../api";

const NameUser = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nameUser, setNameUser] = useState('');

    useEffect(() => {
            
          const fetchProjects = async () => {
            if (!token) {
              setError('Not authenticated. Please log in.');
              setLoading(false);
              return;
            }
    
            try {
                const data = await getNameUserHome(token);
                setNameUser(data.name);
            } catch (err) {
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
          };
    
          fetchProjects();
        }, [token]);

        if (loading) return <div>{' '}</div>;
        if (error) return <div style={{ color: 'red' }}></div>;

    return (
        <div className="sidebar-name styled-text">{nameUser}</div>
    );
};
export default NameUser;