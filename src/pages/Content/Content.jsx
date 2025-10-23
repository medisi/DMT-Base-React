import React, { useEffect, useRef, useState } from "react";
import './Content.css';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NameUser from "../../components/NameUser/NameUser";
import NameDatabase from "../../components/NameDatabase/NameDatabase";

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

const Content = () => {

    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    const lang = settings.language;
    document.title = `DMT Base | ${lang === 'ru' ? 'Состав проекта' : 'The composition of the project'}`;
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarHidden(prevState => !prevState);
    };
    // Refs для сайдбара и resize-handle
    const sidebarRef = useRef(null);
    const resizeHandleRef = useRef(null);
    const navigate = useNavigate();
    const handleQuit = () => {
        navigate('/');
        localStorage.setItem('selectTreeDocs', JSON.stringify(''));
        localStorage.setItem('selectRow', JSON.stringify(''));
    };
    const buttonBack = () => {
        localStorage.setItem('selectTreeDocs', JSON.stringify(''));
        localStorage.setItem('selectRow', JSON.stringify(''));
    }
    const videoLogoRef = useRef(null);
    useEffect(() => {
        if (videoLogoRef.current) {
            videoLogoRef.current.playbackRate = 3.0;
        }
    }, []);
    const { projectName } = useParams();
    const [searchParams] = useSearchParams();
    const prevPage = searchParams.get('prevPage');



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

                <Link to={`/settings?prevPage=content`} id="btn-settings-mobile">
                    <img src={require('../../assets/icons/settings.png')} alt="Выйти" />
                </Link>

                <Link to={`/${prevPage}`} id="button-back" onClick={buttonBack}>
                    <img src={require('../../assets/icons/arrow.png')} alt="Назад" />
                </Link>

                <Link to="/home" className='sidebar-logo' onClick={buttonBack}>
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

                <div className="sidebar-content-btns">
                    <div className="sidebar-content-btn">
                        <span>{lang === 'ru' ? 'Экспорт' : 'Export'}</span>
                    </div>
                    <div className="sidebar-content-btn">
                        <span>{lang === 'ru' ? 'Статистика' : 'Statistics'}</span>
                    </div>
                </div>

                
            </div>

            <button id="btn-quit" onClick={handleQuit}>
                <img src={require('../../assets/icons/quit.png')} alt="Выйти" />
            </button>

            <div className="main_content">
                <div className="main_content-header">
                    <div className="main_content-header-item one">
                        <span className="main_content-header-item-title styled-text">Состав проекта "{projectName}"</span>
                    </div>
                    <div className="main_content-header-item two">
                        <div id="btn-settings">
                            <img src={require('../../assets/icons/settings.png')} alt="" />
                        </div>
                    </div>
                </div>

                <div className="main_sostav-table">
                    <table>
                        <thead>
                            <tr>
                                <th className="col-plus"></th>
                                <th>{lang === 'ru' ? 'Номер тома' : ''}</th>
                                <th>{lang === 'ru' ? 'Базовое обозначение' : ''}</th>
                                <th>{lang === 'ru' ? 'Шифр раздела' : ''}</th>
                                <th>{lang === 'ru' ? 'Форма комплектности' : ''}</th>
                                <th>{lang === 'ru' ? 'Наименование' : ''}</th>
                                <th>{lang === 'ru' ? 'Примечание' : ''}</th>
                                <th>{lang === 'ru' ? 'PDF. Заказчик' : ''}</th>
                                <th>{lang === 'ru' ? 'PDF. Экспертиза' : ''}</th>
                                <th>{lang === 'ru' ? 'ТИМ' : ''}</th>
                                <th>{lang === 'ru' ? 'ГИП' : ''}</th>
                                <th>{lang === 'ru' ? 'Телефон' : ''}</th>
                                <th>{lang === 'ru' ? 'Почта' : ''}</th>
                                <th>{lang === 'ru' ? 'Статус' : ''}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="row-stroke one">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>2</td>
                                <td>25.03-Р</td>
                                <td>АПОТ</td>
                                <td>Раздел 2</td>
                                <td>Архитектурно-планировочная организация территории</td>
                                <td></td>
                                <td>ID: 191143</td>
                                <td></td>
                                <td></td>
                                <td>Бондаренко Л.О.</td>
                                <td>+7-966-337-11-14</td>
                                <td>bondarenko@dmtsoft.com</td>
                                <td></td>
                            </tr>
                            <tr className="row-stroke one">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>5</td>
                                <td>25.03-Р</td>
                                <td>ПОС</td>
                                <td>Раздел 5</td>
                                <td>Проект организации строительства</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>Масалов С.И.</td>
                                <td>+7-903-537-99-58</td>
                                <td>masalov@dmtsoft.com</td>
                                <td></td>
                            </tr>
                            <tr className="row-stroke one open">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>6</td>
                                <td>25.03-Р</td>
                                <td></td>
                                <td>Раздел 6</td>
                                <td>Перечень мероприятий по охране окружающей среды</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr className="row-stroke two">
                                <td className="col-plus"></td>
                                <td>6.1</td>
                                <td>25.03-Р</td>
                                <td>ОРМД</td>
                                <td>Подраздел 1.</td>
                                <td>Мероприятия по охране растительного мира</td>
                                <td></td>
                                <td>ID: 194805</td>
                                <td></td>
                                <td></td>
                                <td>Пушкин Борис</td>
                                <td>+7 903 669-36-80</td>
                                <td>boris_130@mail.ru</td>
                                <td>Передан заказчику</td>
                            </tr>
                            <tr className="row-stroke one">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>7</td>
                                <td>25.03-Р</td>
                                <td>МОДИ</td>
                                <td>Раздел 7</td>
                                <td>Перечень мероприятий по обеспечению доступности для маломобильных групп населения объектов и элементов благоустройства</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>Бондаренко Л.О.</td>
                                <td>+7-966-337-11-14</td>
                                <td>bondarenko@dmtsoft.com</td>
                                <td>Разработан</td>
                            </tr>
                            <tr className="row-stroke one open more">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>8</td>
                                <td>25.03-Р</td>
                                <td></td>
                                <td>Раздел 8</td>
                                <td>Организация дорожного движения</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>Бондаренко Л.О.</td>
                                <td>+7-966-337-11-14</td>
                                <td>bondarenko@dmtsoft.com</td>
                                <td>Разработан</td>
                            </tr>
                            <tr className="row-stroke two">
                                <td className="col-plus"></td>
                                <td>8.1</td>
                                <td>25.03-Р</td>
                                <td>ПОДД-ПОС</td>
                                <td>Подраздел 1.</td>
                                <td>Организация дорожного движения на период проведения работ</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>Бондаренко Л.О.</td>
                                <td>+7-966-337-11-14</td>
                                <td>bondarenko@dmtsoft.com</td>
                                <td>Разработан</td>
                            </tr>
                            <tr className="row-stroke two add">
                                <td className="col-plus"></td>
                                <td>8.2</td>
                                <td>25.03-Р</td>
                                <td>ПОДД</td>
                                <td>Подраздел 2.</td>
                                <td>Организация дорожного движения на период эксплуатации объекта</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>Бондаренко Л.О.</td>
                                <td>+7-966-337-11-14</td>
                                <td>bondarenko@dmtsoft.com</td>
                                <td>Разработан</td>
                            </tr>
                            <tr className="row-stroke one open">
                                <td className="col-plus">
                                    <span>+</span>
                                </td>
                                <td>11</td>
                                <td>25.03-Р</td>
                                <td></td>
                                <td>Раздел 11</td>
                                <td>Сводный сметный расчет</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr className="row-stroke two">
                                <td className="col-plus"></td>
                                <td>11.1</td>
                                <td>25.03-Р</td>
                                <td>ВОР</td>
                                <td>Подраздел 1.</td>
                                <td>Ведомости объемов работ</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Content;