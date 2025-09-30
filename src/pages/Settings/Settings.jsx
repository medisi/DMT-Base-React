import React, { useEffect, useRef, useState } from 'react';
import './Settings.css';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../AuthContext';
import { getInfoUser } from '../../api';

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
    bgRow: 'false',
    columsTable: ['id', 'code', 'version_ext', 'nameTop', 'nameBottom', 'created', 'whomCreated', 'edited', 'whomEdited'],
    escClose: 'true'
};

const allColumns = [
    { key: 'id', labelRu: 'ID', labelEn: 'ID' },
    { key: 'code', labelRu: 'Шифр', labelEn: 'Code' },
    { key: 'version', labelRu: 'Вер. внутр.', labelEn: 'Internal version' },
    { key: 'version_ext', labelRu: 'Вер. внеш.', labelEn: 'External version' },
    { key: 'nameTop', labelRu: 'Название верхнее', labelEn: 'Upper name' },
    { key: 'nameBottom', labelRu: 'Название нижнее', labelEn: 'Lower name' },
    { key: 'created', labelRu: 'Создан', labelEn: 'Created' },
    { key: 'whomCreated', labelRu: 'Кем создан', labelEn: 'By whom created' },
    { key: 'edited', labelRu: 'Редактирован', labelEn: 'Edited' },
    { key: 'whomEdited', labelRu: 'Кем редактирован', labelEn: 'By whom edited' },
    { key: 'sheet', labelRu: 'Лист', labelEn: 'Sheet' },
    { key: 'size', labelRu: 'Размер', labelEn: 'Size' },
    { key: 'status', labelRu: 'Статус', labelEn: 'Status' }
];

// загрузка из локального хранилища
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('userSettings'));
    return settings ? settings : defaultSettings;
    // return settings || { columsTable: allColumns.map(c => c.key) };
};
// сохранение настроек в локальном хранилище
const saveSettings = (settings) => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
};
// применение настроек
const applySettings = (settings) => {
    const main = document.querySelector('.main');

    main.classList.remove('light', 'dark');
    main.classList.add(settings.theme);

    main.classList.remove('orange', 'blue', 'gray', 'green');
    main.classList.add(settings.colorScheme);

    main.style.fontFamily = settings.fontFamily;
    main.style.fontSize = settings.fontSize + 'px';

    // Применение стилей к элементам
    const styledTitleElements = document.querySelectorAll('.styled-title');
    styledTitleElements.forEach(elementTitle => {
        elementTitle.style.fontSize = (settings.fontSize * 1.2) + 'px';
    });
    const styledTextElements = document.querySelectorAll('.styled-text');
    styledTextElements.forEach(elementText => {
        elementText.style.fontSize = settings.fontSize + 'px';
    });
    const styledTextProfileTitleElements = document.querySelectorAll('.setting-profile-card-title.styled-text');
    styledTextProfileTitleElements.forEach(elementText => {
        elementText.style.fontSize = settings.fontSize + 'px';
        elementText.style.fontWeight = 'bold';
    });
    const styledSubtextElements = document.querySelectorAll('.styled-subtext');
    styledSubtextElements.forEach(elementSubtext => {
        elementSubtext.style.fontSize = (settings.fontSize * 0.9) + 'px';
    });
    const styleImageDivElements = document.querySelectorAll('.setting-item-card-title-image');
    const styleImageElements = document.querySelectorAll('.setting-item-card-title-image img');
    styleImageDivElements.forEach(elementImageDiv => {
        elementImageDiv.style.width = (settings.fontSize * 0.9) + 'px';
        elementImageDiv.style.height = (settings.fontSize * 0.9) + 'px';
    });
    styleImageElements.forEach(elementImage => {
        elementImage.style.width = 'auto';
        elementImage.style.height = (settings.fontSize * 0.9) + 'px';
    });

    document.getElementById('theme-app').value = settings.theme;
    document.getElementById('color-scheme').value = settings.colorScheme;
    document.getElementById('language-select').value = settings.language;
    document.getElementById('blur-bg').value = settings.blurBg;
    document.getElementById('btn-scattering').value = settings.scatteringHeader;

    if (settings.blurBg === 'blur') {
        document.querySelector('.main').classList.add('blur');
    } else {
        document.querySelector('.main').classList.remove('blur');
    };
    document.getElementById('btn-invert').value = settings.invertTextHeader;
    document.getElementById('visible-panel-select').value = settings.panelVisible;

    if (settings.invertTextHeader === 'inverted') {
        document.querySelector('.settings-title-color1').classList.add('invert-text');
        document.querySelector('.settings-title-color2').classList.add('invert-text');
        document.querySelector('.settings-title-color3').classList.add('invert-text');
    } else {
        document.querySelector('.settings-title-color1').classList.remove('invert-text');
        document.querySelector('.settings-title-color2').classList.remove('invert-text');
        document.querySelector('.settings-title-color3').classList.remove('invert-text');
    }

    if (settings.scatteringHeader === 'true') {
        document.querySelector('.main').classList.add('scatt');
    } else {
        document.querySelector('.main').classList.remove('scatt');
    }

    document.getElementById('border-table').value = settings.borderTable;
    document.getElementById('bg-row').value = settings.bgRow;
    document.getElementById('esc-btn').value = settings.escClose;

    
};

const Settings = () => {
    const { token } = useAuth();
    const [settings, setSettings] = useState(loadSettings());

    const [activeSection, setActiveSection] = useState('profile');
    const handleMenuClick = (section) => {
        setActiveSection(section);
        localStorage.setItem('activeSection', section);

        if (window.innerWidth < 768) {
            document.querySelector('.sidebar').classList.add('hidden');
        }
    };
    useEffect(() => {
        const savedSection = localStorage.getItem('activeSection');
        if (savedSection) {
            setActiveSection(savedSection);
        }
    }, []);

    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarHidden(prevState => !prevState);
    };

    // ВЫБОР СТОЛБЦОВ ТАБЛИЦЫ
    const [selectedColumns, setSelectedColumns] = useState(settings.columsTable || allColumns.map(c => c.key));
    // Для drag and drop
    const dragItem = useRef();
    const dragOverItem = useRef();
    // Синхронизируем с настройками при загрузке
    useEffect(() => {
        if (settings.columsTable) {
        setSelectedColumns(settings.columsTable);
        }
    }, [settings.columsTable]);
    // Сохраняем изменения в настройки и localStorage
    useEffect(() => {
        const newSettings = { ...settings, columsTable: selectedColumns };
        setSettings(newSettings);
        saveSettings(newSettings);
    }, [selectedColumns]);
    // Включение/выключение колонки
    const toggleColumn = (key) => {
        setSelectedColumns(prev => {
            if (prev.includes(key)) {
                // Убираем колонку, но не даём убрать все (оставляем минимум одну)
                if (prev.length === 1) return prev;
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    // Обработчики drag and drop
    const handleDragStart = (e, position) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
    };
    const handleDragEnd = () => {
        const listCopy = [...selectedColumns];
        const dragItemContent = listCopy[dragItem.current];
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setSelectedColumns(listCopy);
    };

    // ФОНОВОЕ ИЗОБРАЖЕНИЕ
    const [modalBgImageVisible, setModalBgImageVisible] = useState(false);
    const [activeTabBgImage, setActiveTabBgImage] = useState('one');
    // открыть окно
    const handleOpenModalBgImage = () => {
        setModalBgImageVisible(true);
    }
    const handleTabBgImageClick = (tab) => {
        setActiveTabBgImage(tab);
    }
    // закрыть окно
    const handleCloseModalBgImage = () => {
        setModalBgImageVisible(false);
    }
    const allImages = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
    const lightImages = ['1', '3', '4', '24', '6', '9', '10', '11', '12', '16', '15', '17'];
    const darkImages = ['2', '7', '8', '13', '20', '21', '18', '14', '5', '19', '23', '22'];
    const [changeBgImage, setChangeBgImage] = useState('');
    const handleChangeBgImage = (index) => {
        setChangeBgImage(`bgimage${index}`);
    };
    const saveNewBgImage = () => {
        const newSettings = { ...settings, bgImage: changeBgImage};

        localStorage.setItem('activeSection', 'personalization');
        
        setSettings(newSettings);
        saveSettings(newSettings);
        setModalBgImageVisible(false);

        window.location.reload();
    };
    const deleteBgImage = () => {
        const newSettings = { ...settings, bgImage: '' };
        setSettings(newSettings);
        saveSettings(newSettings);
        setChangeBgImage('');
        setModalBgImageVisible(false);
    };


    const getSectionName = () => {
        switch (activeSection) {
            case 'profile':
                return 'Профиль';
            case 'personalization':
                return 'Персонализация';
            case 'table':
                return 'Таблица';
            case 'security':
                return 'Безопасность';
            case 'support':
                return 'Поддержка';
        };
    };
    const getSectionNameEn = () => {
        switch (activeSection) {
            case 'profile':
                return 'Profile';
            case 'personalization':
                return 'Personalization';
            case 'table':
                return 'Table';
            case 'security':
                return 'Security';
            case 'support':
                return 'Support';
        };
    };
    const navigate = useNavigate();
    const handleQuit = () => {
        navigate('/');
        localStorage.setItem('activeSection', 'profile');
    };

    const [modalFontVisible, setModalFontVisible] = useState(false);
    const [tempFontFamily, setTempFontFamily] = useState(settings.fontFamily);
    const [tempFontSize, setTempFontSize] = useState(settings.fontSize);

    
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    const lang = settings.language;
    document.title = `DMT Base | ${lang === 'ru' ? 'Настройки' : 'Settings'}`;

    const handleThemeChange = (event) => {
        const newSettings = { ...settings, theme: event.target.value};
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleColorSchemeChange = (event) => {
        const newSettings = { ...settings, colorScheme: event.target.value};
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleFontFamilySelect = (font) => {
        setTempFontFamily(font);
    };
    const handleFontSizeSelect = (size) => {
        setTempFontSize(size);
    };
    const applyFontSettings = () => {
        const newSettings = { ...settings, fontFamily: tempFontFamily, fontSize: tempFontSize };
        setSettings(newSettings);
        saveSettings(newSettings);
        setModalFontVisible(false);
    };
    const closeModalFont = () => {
        setModalFontVisible(false);
    }
    const handleLanguageChange = (event) => {
        const newSettings = { ...settings, language: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleBlurBgChange = (event) => {
        const newSettings = { ...settings, blurBg: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleInvertTextHeaderChange = (event) => {
        const newSettings = { ...settings, invertTextHeader: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleScatteringHeaderChange = (event) => {
        const newSettings = { ...settings, scatteringHeader: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handlePanelVisibleChange = (event) => {
        const newSettings = { ...settings, panelVisible: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleBorderTableChange = (event) => {
        const newSettings = { ...settings, borderTable: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleBgRowChange = (event) => {
        const newSettings = { ...settings, bgRow: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const handleEscBtnChange = (event) => {
        const newSettings = { ...settings, escClose: event.target.value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };
    const resetSettings = () => {
        localStorage.removeItem('userSettings');
        localStorage.removeItem('colorsRow');
        localStorage.removeItem('columnWidths');
        setSettings(defaultSettings);
        applySettings(defaultSettings);
        if (settings.bgImage != '') {
            localStorage.setItem('activeSection', 'security');
            window.location.reload();
        }
    };

    const [searchParams] = useSearchParams();
    const encodedPrevPage = searchParams.get('prevPage');
    const prevPage = encodedPrevPage ? decodeURIComponent(encodedPrevPage) : '';
    const absolutePrevPage = prevPage.startsWith('/') ? prevPage : '/' + prevPage;

    const buttonBack = () => {
        localStorage.setItem('activeSection', 'profile');
    }


    // информация о пользователе
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fullNameUser , setFullNameUser ] = useState('');
    const [companyUser , setCompanyUser ] = useState('');
    const [numberUser , setNumberUser ] = useState('');
    const [emailUser , setEmailUser ] = useState('');
    const notValue = `${lang === 'ru' ? 'Не указано' : 'Not info'}`;
    useEffect(() => {
        const fetchProjects = async () => {
            if (!token) {
                setError('Not authenticated. Please log in.');
                setLoading(false);
                return;
            }
            try {
                const data = await getInfoUser (token);
                setFullNameUser (data.long_name);
                setCompanyUser (data.company);
                setNumberUser (data.phone1);
                setEmailUser (data.email);
            } catch (err) {
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [token, lang]);

    const [modalEditPassword, setModalEditPassword] = useState(false);
    const handleOpenModalEditPassword = () => {
        setModalEditPassword(!modalEditPassword);
    };
    const handleCloseModalEditPassword = () => {
        setModalEditPassword(false);
    };
    const [passwordVisible1, setPasswordVisible1] = useState(false);
    const [activeIconPassword1, setActiveIconPassword1] = useState(false);
    const [passwordVisible2, setPasswordVisible2] = useState(false);
    const [activeIconPassword2, setActiveIconPassword2] = useState(false);
    const [passwordVisible3, setPasswordVisible3] = useState(false);
    const [activeIconPassword3, setActiveIconPassword3] = useState(false);
    const togglePasswordVisibility1 = () => {
        setPasswordVisible1(!passwordVisible1);
    };
    const togglePasswordVisibility2 = () => {
        setPasswordVisible2(!passwordVisible2);
    };
    const togglePasswordVisibility3 = () => {
        setPasswordVisible3(!passwordVisible3);
    };
    const handleFocus1 = () => {
        setActiveIconPassword1(true);
    };
    const handleBlur1 = () => {
        setActiveIconPassword1(false);
    };
    const handleFocus2 = () => {
        setActiveIconPassword2(true);
    };
    const handleBlur2 = () => {
        setActiveIconPassword2(false);
    };
    const handleFocus3 = () => {
        setActiveIconPassword3(true);
    };
    const handleBlur3 = () => {
        setActiveIconPassword3(false);
    };

    const videoLogoRef = useRef(null);
    useEffect(() => {
        if (videoLogoRef.current) {
            videoLogoRef.current.playbackRate = 3.0;
        }
    }, []);
    

    return (
        <>
            <div className={`sidebar settings noblur ${isSidebarHidden ? 'hidden' : ''}`}>
                <div className="resize-handle"></div>
                <button
                    id="hidden-sidebar"
                    onClick={toggleSidebar}
                >
                    <img src={require('../../assets/icons/btn-sidebar.png')} alt="" />
                </button>

                <Link to={absolutePrevPage} id="button-back" onClick={buttonBack}>
                    <img src={require('../../assets/icons/arrow.png')} alt="Назад" />
                </Link>
                
                <Link to="/home" className='sidebar-logo'>
                    <video autoPlay muted className='video-logo' ref={videoLogoRef}>
                        <source src={require('../../assets/images/logo.webm')} />
                    </video>
                </Link>
            
                <div className="sidebar_settings-title">
                    {lang === 'ru' ? 'Настройки' : 'Settings'}
                </div>

                <div className="sidebar_settings-menu">
                    <div
                        className={`sidebar_settings-menu-item ${activeSection === 'profile' ? 'active' : ''}`}
                        id="sidebar_settings-profile"
                        onClick={() => handleMenuClick('profile')}
                    >
                        <img src={require('../../assets/icons/user.png')} alt="SB" />
                        <span className="styled-text">
                            {lang === 'ru' ? 'Профиль' : 'Profile'}
                        </span>
                    </div>
                    <div
                        className={`sidebar_settings-menu-item ${activeSection === 'personalization' ? 'active' : ''}`}
                        id="sidebar_settings-personalization"
                        onClick={() => handleMenuClick('personalization')}
                    >
                        <img src={require('../../assets/icons/personalization.png')} alt="SB" />
                        <span className="styled-text">
                            {lang === 'ru' ? 'Персонализация' : 'Personalization'}
                        </span>
                    </div>
                    <div
                        className={`sidebar_settings-menu-item ${activeSection === 'table' ? 'active' : ''}`}
                        id="sidebar_settings-table"
                        onClick={() => handleMenuClick('table')}
                    >
                        <img src={require('../../assets/icons/table.png')} alt="SB" />
                        <span className="styled-text">
                            {lang === 'ru' ? 'Таблица' : 'Table'}
                        </span>
                    </div>
                    <div
                        className={`sidebar_settings-menu-item ${activeSection === 'security' ? 'active' : ''}`}
                        id="sidebar_settings-security"
                        onClick={() => handleMenuClick('security')}
                    >
                        <img src={require('../../assets/icons/security.png')} alt="SB" />
                        <span className="styled-text">
                            {lang === 'ru' ? 'Безопасность' : 'Security'}
                        </span>
                    </div>
                    <div
                        className={`sidebar_settings-menu-item ${activeSection === 'support' ? 'active' : ''}`}
                        id="sidebar_settings-support"
                        onClick={() => handleMenuClick('support')}
                    >
                        <img src={require('../../assets/icons/support.png')} alt="SB" />
                        <span className="styled-text">
                            {lang === 'ru' ? 'Поддержка' : 'Support'}
                        </span>
                    </div>
                </div>

            </div>

            <button id="btn-quit" onClick={handleQuit}>
                <img src={require('../../assets/icons/quit.png')} alt="Выйти" />
            </button>

            <div className="settings_container blur">
                <div className="settings_container-header">
                    <div>
                        <span className="styled-text settings-title-color1">
                            {lang === 'ru' ? 'Настройки' : 'Settings'}
                        </span>
                        <span className="styled-text settings-title-color2">—</span>
                        <span className="name_settings styled-text settings-title-color3">
                            {lang === 'ru' ? getSectionName() : getSectionNameEn()}
                        </span>
                    </div>
                </div>

                {/* profile */}
                <div
                    className={`settings_container-content profile ${activeSection === 'profile' ? 'active' : ''}`}
                    id="setting-profile"
                >
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Основные данные' : 'Basic data'}
                        </div>

                        <div className="setting-profile-cards">
                            <div className="setting-profile-card">
                                <div className="setting-profile-card-title styled-text">
                                    {lang === 'ru' ? 'ФИО' : 'Full name'}
                                </div>
                                <div className="setting-profile-card-text styled-text">{fullNameUser  || notValue}</div>
                            </div>
                            <div className="setting-profile-card">
                                <div className="setting-profile-card-title styled-text">
                                    {lang === 'ru' ? 'Наименование организации' : 'Name of the organization'}
                                </div>
                                <div className="setting-profile-card-text styled-text">{companyUser  || notValue}</div>
                            </div>
                            <div className="setting-profile-card">
                                <div className="setting-profile-card-title styled-text">
                                    {lang === 'ru' ? 'Контактный номер телефона' : 'Contact phone number'}
                                </div>
                                <div className="setting-profile-card-text styled-text">{numberUser  || notValue}</div>
                            </div>
                            <div className="setting-profile-card">
                                <div className="setting-profile-card-title styled-text">
                                    {lang === 'ru' ? 'Электронная почта' : 'Email'}
                                </div>
                                <div className="setting-profile-card-text styled-text">{emailUser  || notValue}</div>
                            </div>
                        </div>
                    </div>
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Изображение' : 'Image'}
                        </div>

                        <div className="setting-profile-image">
                            <div className="setting-profile-image-image">
                                <img src={require('../../assets/icons/user.png')} alt="Image" />
                            </div>
                            <button className="styled-text">
                                {lang === 'ru' ? 'изменить' : 'edit'}
                            </button>
                            <input type="file" hidden />
                        </div>
                    </div>

                    <button id="settigs-btn-quit" className="styled-text" onClick={handleQuit}>
                        {lang === 'ru' ? 'Выйти' : 'Quit'}
                    </button>
                </div>

                <div
                    className={`settings_container-content personalization ${activeSection === 'personalization' ? 'active' : ''}`}
                    id="setting-personalization"
                >
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Оформление' : 'Decoration'}
                        </div>
                        
                        <div className="setting-item-cards">
                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/theme.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Тема' : 'Theme'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="theme-app" className="styled-text" value={settings.theme} onChange={handleThemeChange}>
                                        <option value="light">
                                            {lang === 'ru' ? 'Светлая' : 'Light'}
                                        </option>
                                        <option value="dark">
                                            {lang === 'ru' ? 'Тёмная' : 'Dark'}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/color.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Цветовая схема' : 'Color scheme'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="color-scheme" className="styled-text" value={settings.colorScheme} onChange={handleColorSchemeChange}>
                                        <option value="orange">
                                            {lang === 'ru' ? 'Оранжевая' : 'Orange'}
                                        </option>
                                        <option value="blue">
                                            {lang === 'ru' ? 'Синяя' : 'Blue'}
                                        </option>
                                        <option value="gray">
                                            {lang === 'ru' ? 'Серая' : 'Gray'}
                                        </option>
                                        <option value="green">
                                            {lang === 'ru' ? 'Зелёная' : 'Green'}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/font.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Шрифт' : 'Font'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <button id='btn-select-font' className="styled-text" onClick={() => setModalFontVisible(true)}>
                                        {lang === 'ru' ? 'Выбрать' : 'Select'}
                                    </button>
                                </div>
                            </div>
                            


                        </div>
                    </div>
                    
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Язык' : 'Language'}
                        </div>
                        <div className="setting-item-cards">
                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/language.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Язык' : 'Language'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select
                                        id="language-select"
                                        className="styled-text"
                                        value={settings.language}
                                        onChange={handleLanguageChange}
                                    >
                                        <option value="ru">
                                            {lang === 'ru' ? 'Русский' : 'Russian'}
                                        </option>
                                        <option value="en">
                                            {lang === 'ru' ? 'Английский' : 'English'}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Фон' : 'Background'}
                        </div>
                        <div className="setting-item-cards">
                            <div className="setting-item-card more">
                                <div className="setting-item-card-container">
                                    <div className="setting-item-card-title">
                                        <div className="setting-item-card-title-image">
                                            <img src={require('../../assets/icons/blur.png')} alt="" />
                                        </div>
                                        <span className="styled-text">
                                            {lang === 'ru' ? 'Blur-эффект' : 'Blur-effect'}
                                        </span>
                                    </div>
                                    <div className="setting-item-card-text">
                                        <select id="blur-bg" className="styled-text" value={settings.blurBg} onChange={handleBlurBgChange}>
                                            <option value="blur">
                                                {lang === 'ru' ? 'Да' : 'Yes'}
                                            </option>
                                            <option value="noblur">
                                                {lang === 'ru' ? 'Нет' : 'No'}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div className="setting-more-text styled-text">
                                    {lang === 'ru' ? 'Рекомендуется использовать совместно с фоновым изображением' : 'It is recommended to use it in conjunction with the background image.'}
                                </div>
                            </div>

                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/image.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Изображение' : 'Image'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <button id='btn-select-image' className="styled-text" onClick={handleOpenModalBgImage}>
                                        {lang === 'ru' ? 'Выбрать' : 'Select'}
                                    </button>
                                </div>
                            </div>
                            <div className="setting-item-card more">
                                <div className="setting-item-card-container">
                                    <div className="setting-item-card-title">
                                        <div className="setting-item-card-title-image">
                                            <img src={require('../../assets/icons/invert.png')} alt="" />
                                        </div>
                                        <span className="styled-text">
                                            {lang === 'ru' ? 'Инвертирование текста шапки' : 'Inverting the header text'}
                                        </span>
                                    </div>
                                    <div className="setting-item-card-text">
                                        <select id="btn-invert" className="styled-text" value={settings.invertTextHeader} onChange={handleInvertTextHeaderChange}>
                                            <option value="inverted">
                                                {lang === 'ru' ? 'Да' : 'Yes'}
                                            </option>
                                            <option value="no-inverted">
                                                {lang === 'ru' ? 'Нет' : 'No'}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div className="setting-more-text styled-text">
                                    {lang === 'ru' ? 'Обеспечивает контрастность и читаемость текста при выборе изображения из противоположной темы оформления' : 'Provides contrast and legibility of the text when selecting an image from the opposite theme.'}
                                    
                                </div>
                            </div>
                            <div className="setting-item-card more">
                                <div className="setting-item-card-container">
                                    <div className="setting-item-card-title">
                                        <div className="setting-item-card-title-image">
                                            <img src={require('../../assets/icons/scattering.png')} alt="" />
                                        </div>
                                        <span className="styled-text">
                                            {lang === 'ru' ? 'Осветление/затемнение шапки' : 'Lightening/darkening the cap'}
                                        </span>
                                    </div>
                                    <div className="setting-item-card-text">
                                        <select id="btn-scattering" className="styled-text" onChange={handleScatteringHeaderChange}>
                                            <option value="true">
                                                {lang === 'ru' ? 'Да' : 'Yes'}
                                            </option>
                                            <option value="false">
                                                {lang === 'ru' ? 'Нет' : 'No'}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div className="setting-more-text styled-text">
                                    {lang === 'ru' ? 'Обеспечивает гармоничное сочетание с фоновым изображением без инвертирования текста' : 'Provides a harmonious combination with the background image without inverting the text.'}
                                    
                                </div>
                                
                            </div>

                        </div>
                    </div>
                    
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Прочее' : 'Other'}
                        </div>
                        <div className="setting-item-cards">

                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/esc.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Закрывать модальные окна по Esc' : 'Close modal windows by Esc'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="esc-btn" className="styled-text" onChange={handleEscBtnChange}>
                                        <option value="true">
                                            {lang === 'ru' ? 'Да' : 'Yes'}
                                        </option>
                                        <option value="false">
                                            {lang === 'ru' ? 'Нет' : 'No'}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/panel.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Показывать панель информации' : 'Show the information panel'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="visible-panel-select" className="styled-text" value={settings.panelVisible} onChange={handlePanelVisibleChange}>
                                        <option value="visible">
                                            {lang === 'ru' ? 'Да' : 'Yes'}
                                        </option>
                                        <option value="novisible">
                                            {lang === 'ru' ? 'Нет' : 'No'}
                                        </option>
                                    </select>
                                </div>
                                
                            </div>

                        </div>
                    </div>
                </div>

                {modalBgImageVisible && (
                    <div className="modal-bg-image">
                        <div className="modal-bg-image-container">
                            <div className="modal-bg-image-title styled-title">Выбор изображения</div>
                            <div className="modal-bg-image-content">
                                <div className="modal-bg-image-content-item tabs">
                                    <div
                                        className={`modal-bg-image-tab one ${activeTabBgImage === 'one' ? 'active' : ''}`}
                                        onClick={() => handleTabBgImageClick('one')}
                                    >
                                        <span className="styled-text">{lang === 'ru' ? 'Все' : 'All'}</span>
                                    </div>
                                    <div
                                        className={`modal-bg-image-tab two ${activeTabBgImage === 'two' ? 'active' : ''}`}
                                        onClick={() => handleTabBgImageClick('two')}
                                    >
                                        <span className="styled-text">{lang === 'ru' ? 'Светлые' : 'Light'}</span>
                                    </div>
                                    <div
                                        className={`modal-bg-image-tab three ${activeTabBgImage === 'three' ? 'active' : ''}`}
                                        onClick={() => handleTabBgImageClick('three')}
                                    >
                                        <span className="styled-text">{lang === 'ru' ? 'Тёмные' : 'Dark'}</span>
                                    </div>
                                </div>
                                <div className={`modal-bg-image-content-item cards all ${activeTabBgImage === 'one' ? 'active' : ''}`}>
                                    {allImages.map(index => (
                                        <div
                                            key={index}
                                            className={`modal-bg-image-card ${changeBgImage === `bgimage${index}` ? 'active' : ''}`}
                                            id={`bgimage${index}`}
                                            onClick={() => handleChangeBgImage(index)}
                                        >
                                            <img src={require(`../../assets/images/default-bg/bgimage${index}.png`)} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className={`modal-bg-image-content-item cards light ${activeTabBgImage === 'two' ? 'active' : ''}`}>
                                    {lightImages.map(index => (
                                        <div
                                            key={index}
                                            className={`modal-bg-image-card ${changeBgImage === `bgimage${index}` ? 'active' : ''}`}
                                            id={`bgimage${index}`}
                                            onClick={() => handleChangeBgImage(index)}
                                        >
                                            <img src={require(`../../assets/images/default-bg/bgimage${index}.png`)} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className={`modal-bg-image-content-item cards dark ${activeTabBgImage === 'three' ? 'active' : ''}`}>
                                    {darkImages.map(index => (
                                        <div
                                            key={index}
                                            className={`modal-bg-image-card ${changeBgImage === `bgimage${index}` ? 'active' : ''}`}
                                            id={`bgimage${index}`}
                                            onClick={() => handleChangeBgImage(index)}
                                        >
                                            <img src={require(`../../assets/images/default-bg/bgimage${index}.png`)} alt="" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-bg-image-btns">
                                <button className="modal-bg-image-btn accept" onClick={saveNewBgImage}>Применить</button>
                                <button className="modal-bg-image-btn delete" onClick={deleteBgImage}>Удалить фон</button>
                                <button className="modal-bg-image-btn cancel" onClick={handleCloseModalBgImage}>Отменить</button>
                            </div>
                        </div>
                    </div>
                )}

                {modalFontVisible && (
                    <div className={`modal-fonts ${setModalFontVisible ? 'active' : ''}`}>
                        <div className="modal-fonts-content">
                            <div className="modal-fonts-title">
                                {lang === 'ru' ? 'Выбор шрифта' : 'Font Selection'}
                            </div>
                            <div className="modal-fonts-items">
                                <div className="modal-fonts-item">
                                    <div className="modal-fonts-item-title styled-text">
                                        {lang === 'ru' ? 'Шрифт' : 'Font'}
                                    </div>
                                    <div className="modal-fonts-item-example font-family">
                                        <span className="styled-text">{tempFontFamily}</span>
                                    </div>
                                    <div className="modal-fonts-item-cards ff">
                                        {['Roboto', 'Open Sans', 'Inter', 'Montserrat', 'PTSans', 'Sansation'].map(font => (
                                            <span key={font} className="modal-fonts-item-card ff styled-text" onClick={() => handleFontFamilySelect(font)}>
                                                {font}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-fonts-item fw">
                                    <div className="modal-fonts-item-title styled-text">
                                        {lang === 'ru' ? 'Размер' : 'Size'}
                                    </div>
                                    <div className="modal-fonts-item-example font-size">
                                        <span className="styled-text">{tempFontSize}</span>
                                    </div>
                                    <div className="modal-fonts-item-cards fs">
                                        {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(size => (
                                            <span key={size} className="modal-fonts-item-card fs styled-text" onClick={() => handleFontSizeSelect(size)}>
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-fonts-example">
                                <div className="modal-fonts-example-title styled-text">
                                    {lang === 'ru' ? 'Пример' : 'Example'}
                                </div>
                                <div className="modal-fonts-example-text">
                                    <span className="styled-text" style={{fontFamily: tempFontFamily, fontSize: tempFontSize + 'px'}}>AaBbYyZz</span>
                                </div>
                            </div>
                            <div className="modal-fonts-btns">
                                <button className="modal-fonts-btn accept styled-text" onClick={applyFontSettings}>
                                    {lang === 'ru' ? 'Применить' : 'Apply'}
                                </button>
                                <button className="modal-fonts-btn cancel styled-text" onClick={closeModalFont}>
                                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className={`settings_container-content table ${activeSection === 'table' ? 'active' : ''}`}
                    id="setting-table"
                >
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Границы' : 'The borders'}
                        </div>
                        <div className="setting-item-cards">
                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/border.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Границы таблицы' : 'Table boundaries'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="border-table" className="styled-text" onChange={handleBorderTableChange}>
                                        <option value="true">
                                            {lang === 'ru' ? 'Да' : 'Yes'}
                                        </option>
                                        <option value="false">
                                            {lang === 'ru' ? 'Нет' : 'No'}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            {/* <div className="setting-item-card">
                                <div className="setting-item-card-title border noactive">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/palitre.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Цвет границ' : 'Border color'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <input type="color" className="input-toggle-border styled-text" value="#777777" disabled />
                                </div>
                            </div> */}
                        </div>
                    </div>
                    
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Строки' : 'Lines'}
                        </div>
                        <div className="setting-item-cards">
                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/bg-row.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Фон строк таблицы' : 'Background of table rows'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <select id="bg-row" className="styled-text" onChange={handleBgRowChange}>
                                        <option value="true">
                                            {lang === 'ru' ? 'Да' : 'Yes'}
                                        </option>
                                        <option value="false">
                                            {lang === 'ru' ? 'Нет' : 'No'}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div className="setting-item-card more">
                                <div className="setting-item-card-container">
                                    {/* <div className="setting-item-card-title bg-row noactive">
                                        <div className="setting-item-card-title-image">
                                            <img src={require('../../assets/icons/palitre.png')} alt="" />
                                        </div>
                                        <span className="styled-text">
                                            {lang === 'ru' ? 'Цвет фона' : 'Background color'}
                                        </span>
                                    </div>
                                    <div className="setting-item-card-text bg-row">
                                        <input type="color" className="input-toggle-bg-row styled-text" value="#777777" disabled="true" />
                                    </div> */}
                                </div>
                                <div className="setting-more-text styled-text">
                                    {lang === 'ru' ? 'Закрашивается каждая вторая строка' : 'Every second line is filled in.'}
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Видимость полей' : 'Field visibility'}
                        </div>
                        <div className="table-cols">
                            <div className="table-cols-title styled-text">
                                {lang === 'ru' ? 'Включить поля:' : 'Enable fields:'}
                            </div>
                            <div className="table-cols-items" id="available-fields" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {allColumns.map(({ key, labelRu, labelEn }) => (
                                <div
                                    key={key}
                                    onClick={() => toggleColumn(key)}
                                    className={`table-cols-item styled-text ${selectedColumns.includes(key) ? 'active' : ''}`}
                                    title={lang === 'ru' ? labelRu : labelEn}
                                >
                                    <span>{lang === 'ru' ? labelRu : labelEn}</span>
                                </div>
                                ))}
                            </div>
                            <div className="table-cols-title styled-text" style={{ marginTop: '20px' }}>
                                {lang === 'ru' ? 'Порядок полей:' : 'Field order:'}
                            </div>
                            <div
                                className="table-cols-items grab"
                                id="selected-fields"
                            >
                                {selectedColumns.map((key, index) => {
                                    const col = allColumns.find(c => c.key === key);
                                    if (!col) return null;
                                    return (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnter={(e) => handleDragEnter(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            className="table-cols-item styled-text active"
                                            title={lang === 'ru' ? col.labelRu : col.labelEn}
                                        >
                                            <span>{lang === 'ru' ? col.labelRu : col.labelEn}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div
                    className={`settings_container-content security ${activeSection === 'security' ? 'active' : ''}`}
                    id="setting-security"
                >
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Вход' : 'Login'}
                        </div>
                        <div className="setting-item-cards">
                            <div className="setting-item-card">
                                <div className="setting-item-card-title">
                                    <div className="setting-item-card-title-image">
                                        <img src={require('../../assets/icons/password.png')} alt="" />
                                    </div>
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Пароль' : 'Password'}
                                    </span>
                                </div>
                                <div className="setting-item-card-text">
                                    <button id='btn-select-font' className="styled-text" onClick={handleOpenModalEditPassword}>
                                        {lang === 'ru' ? 'Изменить' : 'Change'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button id="reset-settings" className="styled-text" onClick={resetSettings}>
                            {lang === 'ru' ? 'Сбросить все настройки оформления' : 'Reset all design settings'}
                        </button>
                    </div>
                </div>

                {modalEditPassword && (
                    <div className="modal-security">
                        <div className="modal-security-content">
                            <div className="modal-security-title styled-text">{lang === 'ru' ? 'Изменить пароль' : 'Edit password'}</div>
                            <form className="modal-security-form">
                                <div className="modal-security-form-inputs">
                                    <input type="password" autoComplete="new-password" className='styled-text' hidden />
                                    <div className="modal-security-form-input">
                                        <input
                                            type={passwordVisible1 ? 'text' : 'password'}
                                            className='styled-text'
                                            placeholder={lang === 'ru' ? 'Старый пароль' : 'Old password'}
                                            onFocus={handleFocus1}
                                            onBlur={handleBlur1}
                                        />
                                        <span
                                            className={`modal-security-form-input-icon ${activeIconPassword1 ? 'active' : ''}`}
                                            onClick={togglePasswordVisibility1}
                                        >
                                            {passwordVisible1 ? (
                                                <img src={require('../../assets/icons/eye2.png')} alt="Скрыть пароль" />
                                            ) : (
                                                <img src={require('../../assets/icons/eye1.png')} alt="Показать пароль" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="modal-security-form-input">
                                        <input
                                            type={passwordVisible2 ? 'text' : 'password'}
                                            className='styled-text'
                                            placeholder={lang === 'ru' ? 'Новый пароль' : 'New password'}
                                            onFocus={handleFocus2}
                                            onBlur={handleBlur2}
                                        />
                                        <span
                                            className={`modal-security-form-input-icon ${activeIconPassword2 ? 'active' : ''}`}
                                            onClick={togglePasswordVisibility2}
                                        >
                                            {passwordVisible2 ? (
                                                <img src={require('../../assets/icons/eye2.png')} alt="Скрыть пароль" />
                                            ) : (
                                                <img src={require('../../assets/icons/eye1.png')} alt="Показать пароль" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="modal-security-form-input">
                                        <input
                                            type={passwordVisible3 ? 'text' : 'password'}
                                            className='styled-text'
                                            placeholder={lang === 'ru' ? 'Подтвердите новый пароль' : 'New password'}
                                            onFocus={handleFocus3}
                                            onBlur={handleBlur3}
                                        />
                                        <span
                                            className={`modal-security-form-input-icon ${activeIconPassword3 ? 'active' : ''}`}
                                            onClick={togglePasswordVisibility3}
                                        >
                                            {passwordVisible3 ? (
                                                <img src={require('../../assets/icons/eye2.png')} alt="Скрыть пароль" />
                                            ) : (
                                                <img src={require('../../assets/icons/eye1.png')} alt="Показать пароль" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="modal-security-form-btns">
                                    <button className="modal-security-form-btn styled-text" onClick={handleCloseModalEditPassword}>{lang === 'ru' ? 'Отмена': 'Cancel'}</button>
                                    <button className="modal-security-form-btn edit styled-text">{lang === 'ru' ? 'Изменить': 'Edit'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                <div
                    className={`settings_container-content support ${activeSection === 'support' ? 'active' : ''}`}
                    id="setting-support"
                >
                    <div className="settings_container-content-item">
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Контакты' : 'Contacts'}
                        </div>
                        <div className="contact-cards">
                            <div className="contact-image">
                                <img src={require('../../assets/icons/sys_admin.png')} alt="" />
                            </div>
                            <div className="contact-items">
                                <div className="contact-item title">
                                    <span className="styled-text">
                                        {lang === 'ru' ? 'Системный администратор' : 'System administrator'}
                                    </span>
                                </div>
                                <div className="contact-item">
                                    <span className="styled-subtext">+1 111 111-11-11</span>
                                    <span className="styled-subtext">system@admin.com</span>
                                </div>
                            </div>
                        </div>
                        <div className="settings_container-content-item-title styled-title">
                            {lang === 'ru' ? 'Поддержка' : 'Support'}
                        </div>
                        <div className="support-content">
                            <div className="support-content-text styled-text">
                                {lang === 'ru' ? 'Отправить заявку в Help Desk' : 'Send a request to the Help Desk'}
                            </div>
                            <button id="support-content-link" className="support-content-link">
                                {/* <span className="styled-text">Связаться</span> */}
                                <a target='_blank' href="https://dmtsoft.freshdesk.com/support/home" className="styled-text">
                                    {lang === 'ru' ? 'Связаться' : 'Contact'}
                                </a>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default Settings;
