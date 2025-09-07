import React, { useEffect, useState } from 'react';
import { getProjects } from '../../api';
import { useAuth } from '../../AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const TreeNodeHome = ({ node, onProjectOneClick, isActive, onNodeClick, openNodes }) => {
  const hasChildren = node.children && node.children.length > 0;
  const className = hasChildren ? "sidebar_menu-item-project group-list" : "sidebar_menu-item-project";

  const handleOneClick = (e) => {
    if (!hasChildren) {
      e.stopPropagation();
      onProjectOneClick(node);
    } else {
      onNodeClick(node);
    }
  };

  const navigate = useNavigate();
  const handleDoubleClick = () => {
    navigate(`${`/all_documents/${encodeURIComponent(node.id)}/${encodeURIComponent(node.shortname)}`}`);
  }

  return (
    <li>
      <div className={className} onClick={handleOneClick} onDoubleClick={handleDoubleClick}>
        {hasChildren && (
          <div className='sidebar_menu-item-project-div-image'>
            <img
              src={require('../../assets/icons/chevron.png')}
              className={`sidebar_menu-item-project-image ${isActive ? 'active' : ''}`}
              alt=""
              style={{ transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .3s ease' }}
            />
          </div>
        )}
        <span className="styled-text">{node.shortname}</span>

        <Link to={`/all_documents/${encodeURIComponent(node.id)}/${encodeURIComponent(node.shortname)}`} className='sidebar_menu-item-project-link'>
          <img src={require('../../assets/icons/arrow2.png')} alt="Перейти" />
        </Link>
      </div>
      {hasChildren && isActive && (
        <ul style={{ paddingLeft: '20px' }}>
          {node.children.map(child => (
            <TreeNodeHome
              key={child.id}
              node={child}
              onProjectOneClick={onProjectOneClick}
              isActive={openNodes[child.id] || false}
              onNodeClick={onNodeClick}
              openNodes={openNodes}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
const defaultSettings = {
    theme: 'light',
    colorScheme: 'orange',
    fontFamily: 'Roboto',
    fontSize: '16',
    language: 'ru'
};

// Загрузка настроек из localStorage
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('userSettings'));
    return settings ? settings : defaultSettings;
};
// Применение настроек
const applySettings = (settings) => {
    const main = document.querySelector('.main');

    main.classList.remove('light', 'dark');
    main.classList.add(settings.theme);

    main.classList.remove('orange', 'blue', 'gray');
    main.classList.add(settings.colorScheme);

    main.style.fontFamily = settings.fontFamily;
    main.style.fontSize = settings.fontSize + 'px';
};

const ProjectTreeHome = ({ onProjectOneClick }) => {
  const { token } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openNodes, setOpenNodes] = useState({});

  const [settings, setSettings] = useState(loadSettings());
  useEffect(() => {
      applySettings(settings);
  }, [settings]);


  const lang = settings.language;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        // setError('Not authenticated. Please log in.');
        setError(`${lang === 'ru' ? 'Не авторизован. Пожалуйста, войдите в систему.' : 'Not authenticated. Please log in.'}`);
        setLoading(false);
        return;
      }

      try {
        const data = await getProjects(token);
        if (data) {
          setTreeData(data);
        } else {
          // setError('Failed to load data.');
          setError(`${lang === 'ru' ? 'Не удалось загрузить данные.' : 'Failed to load data.'}`);
        }
      } catch (err) {
        // setError('Failed to load data.');
        setError(`${lang === 'ru' ? 'Не удалось загрузить данные.' : 'Failed to load data.'}`);
        // console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  const handleNodeClick = (node) => {
    setOpenNodes(prevState => ({
      ...prevState,
      [node.id]: !prevState[node.id]
    }));
  };

  if (loading) return <div>{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <ul>
      {treeData.map(node => (
        <TreeNodeHome
          key={node.id}
          node={node}
          onProjectOneClick={onProjectOneClick}
          isActive={openNodes[node.id] || false}
          onNodeClick={handleNodeClick}
          openNodes={openNodes}
        />
      ))}
    </ul>
  );
};

export default ProjectTreeHome;