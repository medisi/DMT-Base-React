import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import { Link, useNavigate } from 'react-router';
import ProjectTreeHome from '../../components/ProjectTreeHome/ProjectTreeHome';
import { getProjectProperties } from '../../api';
import { useAuth } from '../../AuthContext';
import NameDatabase from '../../components/NameDatabase/NameDatabase';
import NameUser from '../../components/NameUser/NameUser';

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
    const main = document.querySelector('.main');

    main.classList.remove('light', 'dark');
    main.classList.add(settings.theme);

    main.classList.remove('orange', 'blue', 'gray');
    main.classList.add(settings.colorScheme);

    main.style.fontFamily = settings.fontFamily;
    main.style.fontSize = settings.fontSize + 'px';

    if (settings.blurBg === 'blur') {
        document.querySelector('.main').classList.add('blur');
    } else {
        document.querySelector('.main').classList.remove('blur');
    }
};

const Home = () => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    const lang = settings.language;
    document.title = `DMT Base | ${lang === 'ru' ? 'Главная страница' : 'Home page'}`;

    const { token } = useAuth();

    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [activeProject, setActiveProject] = useState(null);
    const [projectProperties, setProjectProperties] = useState(null); // Состояние для хранения свойств проекта
    
    const handleProjectClick = (title) => {
        setActiveProject(title); // Устанавливаем активный проект
    };

    const toggleSidebar = () => {
        setIsSidebarHidden(prevState => !prevState);
    };

    const navigate = useNavigate();
    const handleQuit = () => {
        navigate('/');
    };

    const handleProjectOneClick = async (project) => {
        // Если кликаем по уже активному проекту - скрываем его
        if (activeProject && activeProject.id === project.id) {
            setActiveProject(null);
            setProjectProperties(null); // Сбрасываем свойства при скрытии проекта
        } else {
            setActiveProject(project); // Иначе показываем новый проект
            // console.log('Selected Project ID:', project.id); // Проверяем ID проекта
            // Получаем свойства проекта
            try {
                const properties = await getProjectProperties(token, project.id); // Передаем token и project.id
                setProjectProperties(properties); // Сохраняем свойства в состоянии
            } catch (error) {
                // console.error('Ошибка при получении свойств проекта:', error);
            }
        }
    };

    const videoLogoRef = useRef(null);
    useEffect(() => {
        if (videoLogoRef.current) {
            videoLogoRef.current.playbackRate = 2.0;
        }
    }, []);

    // Refs для сайдбара и resize-handle
    const sidebarRef = useRef(null);
    const resizeHandleRef = useRef(null);
    
    // Функции для обработки ресайза
    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseMove = (e) => {
        if (sidebarRef.current && !isSidebarHidden) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            // Ограничиваем ширину между min (200px) и max (400px)
            const clampedWidth = Math.max(200, Math.min(400, newWidth));
            sidebarRef.current.style.width = clampedWidth + 'px';
        }
    };
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    // Добавляем обработчики событий для resize-handle
    useEffect(() => {
        const handle = resizeHandleRef.current;
        if (handle) {
            handle.addEventListener('mousedown', handleMouseDown);
            return () => {
                handle.removeEventListener('mousedown', handleMouseDown);
            };
        }
    }, [isSidebarHidden]); // Перерегистрируем при изменении видимости сайдбара
    

    return (
        <>
            <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`} ref={sidebarRef} style={{ width: isSidebarHidden ? '0px' : undefined }}>
                <div className="resize-handle" ref={resizeHandleRef}></div>

                <button
                    id="hidden-sidebar"
                    onClick={toggleSidebar}
                >
                    <img src={require('../../assets/icons/btn-sidebar.png')} alt="" />
                </button>

                <Link to={`/settings?prevPage=home`} id="btn-settings-mobile">
                    <img src={require('../../assets/icons/settings.png')} alt="Настройки" />
                </Link>

                <Link to="/home" className='sidebar-logo'>
                    <video autoPlay muted className='video-logo' ref={videoLogoRef}>
                        <source src={require('../../assets/images/logo.webm')} />
                    </video>

                </Link>
                <div className="sidebar-user-image">    
                    <img src={require('../../assets/images/user.png')} alt="" />
                </div>
                
                <div className='sidebar-userName-dataBase'>
                    <NameUser />
                    <NameDatabase />
                </div>

                <div className="sidebar-menu home active" style={{marginTop: 20 + 'px'}}>
                    <ProjectTreeHome onProjectOneClick={handleProjectOneClick} />
                </div>
            </div>

            <button id="btn-quit" onClick={handleQuit}>
                <img src={require('../../assets/icons/quit.png')} alt="Выйти" />
            </button>  

            <div className="main_content home">
                <div className="main_content-header home">
                    <div className="main_content-header-item">
                        <Link to={`/settings?prevPage=home`} id="btn-settings">
                            <img src={require('../../assets/icons/settings.png')} alt="" />
                        </Link>
                    </div>
                </div>

                <div className={`about_project ${activeProject ? 'active' : ''}`}>
                    {projectProperties && (
                        <div className="about_project-content">
                            <div className="about_project-content-item">
                                <div className="about_project-item">
                                    <div className="about_project-item-title styled-text">{lang === 'ru' ? 'ID' : 'ID'}</div>
                                    <div className="about_project-item-text center styled-text">{projectProperties.id || 'Не указано'}</div>
                                </div>
                                <div className="about_project-item">
                                    <div className="about_project-item-title styled-text">{lang === 'ru' ? 'Короткое название' : 'Shortname'}</div>
                                    <div className="about_project-item-text styled-text">{projectProperties.shortname || 'Не указано'}</div>
                                </div>
                                <div className="about_project-item">
                                    <div className="about_project-item-title styled-text">{lang === 'ru' ? 'Стадия' : 'Stage'}</div>
                                    <div className="about_project-item-text center styled-text">{projectProperties.stage || 'Не указано'}</div>
                                </div>
                            </div>
                            <div className="about_project-content-item">
                                <div className="about_project-item">
                                    <div className="about_project-item-title styled-text">{lang === 'ru' ? 'КГИП' : 'KGIP'}</div>
                                    <div className="about_project-item-text center styled-text">{projectProperties.gip?.name || 'Не указано'}</div>
                                </div>
                                <div className="about_project-item">
                                    <div className="about_project-item-title styled-text">{lang === 'ru' ? 'Полное название' : 'Fullname'}</div>
                                    <div className="about_project-item-text styled-text">{projectProperties.name || 'Не указано'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;