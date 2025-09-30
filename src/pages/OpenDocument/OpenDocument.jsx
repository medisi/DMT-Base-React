import React, { useEffect, useRef, useState } from 'react';
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
    const [filename, setFilename] = useState('file-document');
    const [fileType, setFileType] = useState(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [errorFile, setErrorFile] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [activeIconPassword, setActiveIconPassword] = useState(false);

    const [searchParams] = useSearchParams();
    // Получаем параметры из URL
    const linkPage = searchParams.get('prevPage');
    const documentId = searchParams.get('documentId');
    const documentExt = searchParams.get('ext');
    const documentCode = searchParams.get('code');
    const docName = searchParams.get('name');

    const location = useLocation();
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
    // useEffect(() => {
    //     if (!documentId || !token) return;
    //     const fetchDocumentFile = async () => {
    //         setLoadingFile(true);
    //         setErrorFile(null);
    //         try {
    //             const response = await fetch(`${apiUrl}/documents/${documentId}/file/`, {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             });
    //             // console.log('response: ', response);
    //             if (!response.ok) {
    //                 throw new Error(`Ошибка загрузки документа: ${response.statusText}`);
    //             }
    //             const blob = await response.blob();
    //             const url = URL.createObjectURL(blob);
    //             setFileUrl(url);
    //         } catch (err) {
    //             setErrorFile(err.message);
    //         } finally {
    //             setLoadingFile(false);
    //         }
    //     };
    //     fetchDocumentFile();
    //     return () => {
    //         if (fileUrl) {
    //             URL.revokeObjectURL(fileUrl);
    //         }
    //     };
    // }, [documentId, token]);
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

    const [fileExtension, setFileExtension] = useState();

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
                // const contentDisposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition');
                // let filename = 'file';
                // if (contentDisposition) {
                //     // Попытка получить filename*=UTF-8''encodedfilename
                //     const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\r\n]+)/i);
                //     if (filenameStarMatch && filenameStarMatch[1]) {
                //         filename = decodeURIComponent(filenameStarMatch[1]);
                //     } else {
                //         // Попытка получить filename="filename"
                //         const filenameMatch = contentDisposition.match(/filename="?([^\";]+)"?/i);
                //         if (filenameMatch && filenameMatch[1]) {
                //             filename = filenameMatch[1];
                //         }
                //     }
                // }
                const extension = response.headers.get('Content-Type') || response.headers.get('content-type');
                setFileExtension(extension.split('/').pop().toLowerCase());


                const blob = await response.blob();
                setFileType(blob.type);
                const url = URL.createObjectURL(blob);
                setFileUrl(url);
                setFilename(filename);
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
                <Link to={linkPage ? `/${linkPage}` : '/all_documents'} id="open_doc-btn">
                    <img src={require('../../assets/icons/arrow.png')} alt="" />
                </Link>
                {/* <div className="open_doc-title"><span>Название документа</span></div> */}
                <div className="open_doc-title"><span>{documentName}</span></div>
                <div className="open_doc-btns">
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
                    <>
                        {fileExtension === 'pdf' ? (
                            <iframe
                                style={{filter: 'invert(100%)'}}
                                src={fileUrl}
                            />
                        ) : (
                            <div>
                                <span>Файл: <span>{`${documentCode}_${docName}.${documentExt}`}</span></span>
                                <a href={fileUrl} download={`${documentCode}_${docName}.${documentExt}`}>Скачать</a>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OpenDocument;