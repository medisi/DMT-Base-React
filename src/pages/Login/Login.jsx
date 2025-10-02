import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom'; // Импортируйте useNavigate
import './Login.css';
import NameDatabase from '../../components/NameDatabase/NameDatabase';

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

const Login = () => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    const lang = settings.language;
    document.title = `DMT Base | ${lang === 'ru' ? 'Войти' : 'Login'}`;

    
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showError, setShowError] = useState(false);
    const navigate = useNavigate();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [activeIconPassword, setActiveIconPassword] = useState(false);
    
    const inputPasswordRef = useRef();

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    const handleFocus = () => {
        setActiveIconPassword(true);
    };
    const handleBlur = () => {
        setActiveIconPassword(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/home'); // Переход на страницу /home после успешного входа
        } catch (err) {
            // setError('Неверный логин и/или пароль'); // Устанавливаем сообщение об ошибке
            setError(lang === 'ru' ? 'Неверный логин и/или пароль' : 'Invalid username and/or password');
            setShowError(true);

            // Убираем ошибку через 3 секунды
            setTimeout(() => {
                setShowError(false);
                setError(''); // Сбрасываем сообщение об ошибке
            }, 3000);
        }
    };

    const videoLogoRef = useRef(null);
    useEffect(() => {
        if (videoLogoRef.current) {
            videoLogoRef.current.playbackRate = 3.0;
        }
    }, []);


    return (
            <div className="login-container" settings={settings} setSettings={setSettings}>
                <div className="login-header">
                    <div className='login-logo'>
                        <video autoPlay muted className='video-logo' ref={videoLogoRef}>
                            <source src={require('../../assets/images/logo.webm')} />
                        </video>
                    </div>

                    <NameDatabase />
                </div>

                <div className="login_content">
                    <form onSubmit={handleSubmit}>
                        <h1>
                            {lang === 'ru' ? 'Вход в личный кабинет' : 'Log in to your account'}
                        </h1>

                        <div className="login-input">
                            <input
                                type="text"
                                placeholder={lang === 'ru' ? 'Введите логин' : 'Enter the login'}
                                className='login-inputs styled-text'
                                id='input-login'
                                autoComplete='off'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="login-input">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder={lang === 'ru' ? 'Введите пароль' : 'Enter the password'}
                                className='login-inputs styled-text'
                                id='input-password'
                                autoComplete='off'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                onFocus={handleFocus} // Добавляем обработчик фокуса
                                onBlur={handleBlur} // Добавляем обработчик дефокуса
                                ref={inputPasswordRef}
                            />
                            <span
                                className={`login-input-icon ${activeIconPassword ? 'active' : ''}`}
                                onClick={togglePasswordVisibility}
                            >
                                {passwordVisible ? (
                                    <img src={require('../../assets/icons/eye2.png')} alt="Скрыть пароль" />
                                ) : (
                                    <img src={require('../../assets/icons/eye1.png')} alt="Показать пароль" />
                                )}
                            </span>
                        </div>
                        <button
                            type="submit"
                            id='button-login'
                            className='styled-text'
                        >
                            {lang === 'ru' ? 'Войти' : 'Login'}
                        </button>
                    </form>
                </div>
                {showError && (
                    <div className={`error-modal`}>
                        <div className="error-modal-content">
                            <div className="error-modal-title styled-text">
                                {lang === 'ru' ? 'Ошибка входа' : 'Login error'}
                            </div>
                            <div className="error-modal-text styled-text">{error}</div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default Login;