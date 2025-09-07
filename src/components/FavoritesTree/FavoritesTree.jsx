import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getTypeTree } from '../../api';
const TreeNode = ({ node, isActive, onNodeClick, openNodes, activeNodeId, setActiveNodeId }) => {
  const hasChildren = node.children && node.children.length > 0;
  const className = hasChildren ? "sidebar_menu-item-project group-list" : "sidebar_menu-item-project";
  const [isSelected, setIsSelected] = useState(false);
  const handleOneClick = (e) => {
    document.querySelectorAll('.sidebar_menu-item-project').forEach(el => {
      el.classList.remove('active');
    });
    onNodeClick(node);
    setIsSelected(!isSelected);
    localStorage.setItem('selectTreeDocs', JSON.stringify(node.id));
  };
  return (
    <li>
      <div className={`${className} favor ${isSelected ? 'active' : ''}`} onClick={handleOneClick} data-node-id={node.id}>
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
const FavoritesTree = ({ favorites, onFilterByIdType  }) => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [filteredTree, setFilteredTree] = useState([]);
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
  // Фильтруем дерево по избранным
  useEffect(() => {
    if (!treeData.length) return;
    if (!favorites.length) {
      setFilteredTree([]);
      return;
    }
    const filterTreeByFavorites = (nodes, favorites, projectId) => {
      return nodes
        .map(node => {
          const filteredChildren = node.children ? filterTreeByFavorites(node.children, favorites, projectId) : [];
          const hasFavoriteInNode = filteredChildren.length > 0 || favorites.some(fav =>
            fav.projectId === projectId && fav.id_type === node.id
            );
          if (hasFavoriteInNode) {
            return {
              ...node,
              children: filteredChildren
            };
          }
          return null;
        })
        .filter(node => node !== null);
    };
    const filtered = filterTreeByFavorites(treeData, favorites, projectId);
    setFilteredTree(filtered);
    // Открываем все узлы по умолчанию, чтобы показать дерево избранных
    const openAllNodes = {};
    const openAll = (nodes) => {
      nodes.forEach(n => {
        openAllNodes[n.id] = true;
        if (n.children) openAll(n.children);
      });
    };
    openAll(filtered);
    setOpenNodes(openAllNodes);
    }, [treeData, favorites, projectId]);
    // const handleNodeClick = (node) => {
    //     setOpenNodes(prev => ({
    //     ...prev,
    //     [node.id]: !prev[node.id]
    //     }));
    //     setActiveNodeId(node.id);
    //     localStorage.setItem('selectTreeDocs', JSON.stringify(node.id));
    // };
    const handleNodeClick = (node) => {
        setOpenNodes(prev => ({
            ...prev,
            [node.id]: !prev[node.id]
        }));
        setActiveNodeId(node.id);
        localStorage.setItem('selectTreeDocs', JSON.stringify(node.id));
        // Вызов колбэка для фильтрации таблицы
        if (onFilterByIdType) {
            onFilterByIdType(node.id);
        }
    };
  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!filteredTree.length) return <div>Избранных нет</div>;
  return (
    <ul ref={treeRef}>
      {filteredTree.map(node => (
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
export default FavoritesTree;