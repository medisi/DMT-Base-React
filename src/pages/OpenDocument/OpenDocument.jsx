import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // Импортируйте useNavigate
import './OpenDocument.css';
import { Link, useParams, useSearchParams } from 'react-router';
import { apiUrl } from '../../settings';

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

const OpenDocument = () => {
    const [settings, setSettings] = useState(loadSettings());
    const { login, token } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showError, setShowError] = useState(false);
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [errorFile, setErrorFile] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [activeIconPassword, setActiveIconPassword] = useState(false);

    const [searchParams] = useSearchParams();
    // Получаем параметры из URL
    const linkPage = searchParams.get('prevPage');
    const documentId = searchParams.get('documentId');
    // Получаем название документа из пути
    // location.pathname: /DMT-Base-React/open_document/название
    // В вашем случае, если используется hash routing, можно использовать location.hash
    const location = useLocation();
    // Если используется hash routing, то:
    // const path = location.hash.startsWith('#/') ? location.hash.slice(2) : location.hash;
    // const documentNameEncoded = path.split('/')[1]; // после open_document/
    // Но проще взять из pathname, если настроен роутинг без хеша:
    const pathParts = location.pathname.split('/');
    // Ищем индекс open_document
    const openDocIndex = pathParts.findIndex(part => part === 'open_document');
    const documentNameEncoded = openDocIndex !== -1 && pathParts.length > openDocIndex + 1
        ? pathParts[openDocIndex + 1]
        : '';
    const documentName = decodeURIComponent(documentNameEncoded);
    // Кодируем prevPage для передачи в ссылку
    const encodedPrevPage = encodeURIComponent(
        `/open_document/${documentNameEncoded}/?documentId=${documentId}&prevPage=${linkPage}`
    );
    // Применяем настройки при монтировании и при изменении settings
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    // Загрузка файла документа
    useEffect(() => {
        if (!documentId || !token) return;
        const fetchDocumentFile = async () => {
            setLoadingFile(true);
            setErrorFile(null);
            try {
                const response = await fetch(`${apiUrl}/documents/${documentId}/file/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки документа: ${response.statusText}`);
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setFileUrl(url);
            } catch (err) {
                setErrorFile(err.message);
            } finally {
                setLoadingFile(false);
            }
        };
        fetchDocumentFile();
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [documentId, token]);
    // Обработчики пароля
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
            navigate('/home');
        } catch (err) {
            setError(settings.language === 'ru' ? 'Неверный логин и/или пароль' : 'Invalid username and/or password');
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
                setError('');
            }, 3000);
        }
    };
    const handleQuit = () => {
        navigate('/');
    };

    const [numPages, setNumPages] = useState(null);
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };
    const [fileType, setFileType] = useState(null);
    useEffect(() => {
        if (!documentId || !token) return;
        const fetchDocumentFile = async () => {
            setLoadingFile(true);
            setErrorFile(null);
            try {
                const response = await fetch(`${apiUrl}/documents/${documentId}/file/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки документа: ${response.statusText}`);
                }
                const blob = await response.blob();
                setFileType(blob.type); // сохраняем MIME тип
                const url = URL.createObjectURL(blob);
                setFileUrl(url);
            } catch (err) {
                setErrorFile(err.message);
            } finally {
                setLoadingFile(false);
            }
        };
        fetchDocumentFile();
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [documentId, token]);

    return (
        <div className="open_doc-container">
            <div className="open_document-header">
                {/* <Link to={linkAllDocs} id="open_doc-btn"> */}
                <Link to={linkPage ? `/${linkPage}` : '/all_documents'} id="open_doc-btn">
                    <img src={require('../../assets/icons/arrow.png')} alt="" />
                </Link>
                {/* <div className="open_doc-title"><span>Название документа</span></div> */}
                <div className="open_doc-title"><span>{documentName}</span></div>
                <div className="open_doc-btns">
                    {/* <Link to={`/settings?prevPage=open_document/${encodeURIComponent(documentName)}/?documentId=${documentId}&prevPage=${linkPage}`} className='open_doc-btn settings'>
                        <img src={require('../../assets/icons/settings.png')} alt="" />
                    </Link> */}
                    {/* <Link to={`/settings?prevPage=${encodedPrevPage}`} className='open_doc-btn settings'> */}
                    <Link to={`/settings?prevPage=${encodedPrevPage}`} className='open_doc-btn settings'>
                        <img src={require('../../assets/icons/settings.png')} alt="" />
                    </Link>
                    <div className="open_doc-btn quit" onClick={handleQuit}>
                        <img src={require('../../assets/icons/quit.png')} alt="" />
                    </div>
                </div>
            </div>
            <div className="open_document-main">
                {loadingFile && <div>Загрузка документа...</div>}
                {errorFile && <div style={{color: 'red'}}>{error}</div>}
                {!loadingFile && !errorFile && fileUrl && (
                    <iframe
                        src={fileUrl}
                        title='document'
                    />
                )}
            </div>
        </div>
    );
};

export default OpenDocument;