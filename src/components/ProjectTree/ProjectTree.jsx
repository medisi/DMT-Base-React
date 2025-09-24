import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getTypeTree } from '../../api';

const defaultSettings = {
    theme: 'light',
    colorScheme: 'orange',
    fontFamily: 'Roboto',
    fontSize: '16',
    language: 'ru',
    blurBg: 'noblur',
    bgImage: '',
    invertTextHeader: 'no-inverted',
    scatteringHeader: 'false',
    panelVisible: 'visible',
    borderTable: 'false',
    bgRow: 'false'
};

// Загрузка настроек из localStorage
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('userSettings'));
    return settings ? settings : defaultSettings;
};

// Применение настроек
const applySettings = (settings) => {
};

const TreeNode = ({ node, isActive, onNodeClick, openNodes, activeNodeId, setActiveNodeId }) => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);

    const hasChildren = node.children && node.children.length > 0;
    const className = hasChildren ? "sidebar_menu-item-project group-list" : "sidebar_menu-item-project";
    const [isSelected, setIsSelected] = useState(false);

    const handleOneClick = (e) => {
        // document.querySelectorAll('.sidebar_menu-item-project').forEach(el => {
        //     el.classList.remove('active');
        // });
        onNodeClick(node);
        setIsSelected(!isSelected);
        localStorage.setItem('selectTreeDocs', JSON.stringify(node.id));

        
    };

    return (
        <li>
            <div
                // className={`${className} ${isSelected ? 'active' : ''}`}
                className={`${className} ${activeNodeId === node.id ? 'active' : ''}`}
                onClick={handleOneClick}
                data-node-id={node.id}
            >
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
                <span className="styled-text">{node.text}</span>
            </div>
            {hasChildren && isActive && (
                <ul style={{ paddingLeft: '20px' }}>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            isActive={openNodes[child.id] || false}
                            onNodeClick={onNodeClick}
                            openNodes={openNodes}
                            activeNodeId={activeNodeId}
                            setActiveNodeId={setActiveNodeId}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

const ProjectTree = ({ onProjectSelect, onHistoryUpdate  }) => {
    const { projectId } = useParams();
    const { token } = useAuth();
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openNodes, setOpenNodes] = useState({});
    const [activeNodeId, setActiveNodeId] = useState(null);
    const treeRef = useRef(null);

    useEffect(() => {
        const fetchTreeData = async () => {
            if (!token) {
                setError('Not authenticated. Please log in.');
                setLoading(false);
                return;
            }

            try {
                const data = await getTypeTree(token, projectId);
                if (data) {
                    setTreeData(data);
                    // if (data.length > 0) {
                    //     setOpenNodes(prevState => ({
                    //         ...prevState,
                    //         [data[0].id]: true // Открываем первый узел
                    //     }));
                    // }
                    if (data && data.length > 0) {
                        setTreeData(data);
                        setOpenNodes(prevState => ({
                            ...prevState,
                            [data[0].id]: true // Открываем первый узел
                        }));
                        setActiveNodeId(data[0].id); // Устанавливаем активность на первый узел (главную ветку)
                        localStorage.setItem('selectTreeDocs', JSON.stringify(data[0].id));
                    }
                } else {
                    setError('Failed to load data.');
                }
            } catch (err) {
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };

        fetchTreeData();
    }, [token, projectId]);

    // Функция для раскрытия всех родителей выбранного узла
    const expandParents = (nodeId, nodes, openNodesState) => {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return true;
            }
            if (node.children) {
                const foundInChild = expandParents(nodeId, node.children, openNodesState);
                if (foundInChild) {
                    openNodesState[node.id] = true;
                    return true;
                }
            }
        }
        return false;
    };

    // Восстановление выбора и скролл к узлу после загрузки данных
    useEffect(() => {
        if (!treeData.length) return;
        const savedNodeId = JSON.parse(localStorage.getItem('selectTreeDocs'));
        if (!savedNodeId) return;
        const newOpenNodes = { ...openNodes };
        expandParents(savedNodeId, treeData, newOpenNodes);
        setOpenNodes(newOpenNodes);
        setActiveNodeId(savedNodeId);
        // Ждём рендер раскрытых узлов, затем скроллим
        setTimeout(() => {
            if (!treeRef.current) return;
            const nodeElement = treeRef.current.querySelector(`div[data-node-id="${savedNodeId}"]`);
            if (nodeElement) {
                nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }, [treeData]);

    const [historyLists, setHistoryLists] = React.useState(() => {
        const saved = localStorage.getItem('historyList');
        return saved ? JSON.parse(saved) : [];
    });
    const addToHistory = (node) => {
        if (node.children && node.children.length > 0) {
            return;
        }
        setHistoryLists(prevHistoryLists => {
            const filtered = prevHistoryLists.filter(item => item.id !== node.id);
            let updatedHistoryList = [...filtered, { id: node.id, name: node.text }];
            if (updatedHistoryList.length > 20) {
                updatedHistoryList = updatedHistoryList.slice(updatedHistoryList.length - 20);
            }
            localStorage.setItem('historyList', JSON.stringify(updatedHistoryList));
            if (onHistoryUpdate) onHistoryUpdate(updatedHistoryList);
            return updatedHistoryList;
        });
    };

    const handleNodeClick = (node) => {
        const collectIds = (node) => {
            let ids = [node.id];
            if (node.children) {
                node.children.forEach(child => {
                    ids = ids.concat(collectIds(child));
                });
            }
            return ids;
        };

        const allIds = collectIds(node);
        onProjectSelect(allIds);

        // Переключаем состояние открытого узла
        setOpenNodes(prevState => ({
            ...prevState,
            [node.id]: !prevState[node.id]
        }));

        // Устанавливаем активный узел
        setActiveNodeId(node.id);
        localStorage.setItem('selectTreeDocs', JSON.stringify(node.id));
        addToHistory(node);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <ul ref={treeRef}>
            {treeData.map(node => (
                <TreeNode
                    key={node.id}
                    node={node}
                    onNodeClick={handleNodeClick}
                    isActive={openNodes[node.id] || false}
                    openNodes={openNodes}
                    activeNodeId={activeNodeId}
                    setActiveNodeId={setActiveNodeId}
                />
            ))}
        </ul>
    );
};

export default ProjectTree;
