import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AllDocuments.css';
import { Link, useNavigate, useParams } from 'react-router';
import ProjectTree from '../../components/ProjectTree/ProjectTree';
// import { hasFormSubmit } from '@testing-library/user-event/dist/utils';
import NameDatabase from '../../components/NameDatabase/NameDatabase';
import { getDocuments } from '../../api';
import { useAuth } from '../../AuthContext';

const defaultSettings = {
    theme: 'light',
    colorScheme: 'orange',
    fontFamily: 'Roboto',
    fontSize: '16',
    language: 'ru',
    blurBg: 'noblur',
    invertTextHeader: 'no-inverted',
    scatteringHeader: 'false',
    panelVisible: 'visible'
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

    if (settings.invertTextHeader === 'inverted') {
        document.querySelector('.main_content-header-item-title').classList.add('invert-text');
    } else {
        document.querySelector('.main_content-header-item-title').classList.remove('invert-text');
    }

    if (settings.panelVisible === 'visible') {
        document.querySelector('.main_content-panel').classList.add('visible-panel');
        document.querySelector('.main_content-panel').classList.remove('novisible-panel');
    } else {
        document.querySelector('.main_content-panel').classList.add('novisible-panel');
        document.querySelector('.main_content-panel').classList.remove('visible-panel');
    }
    
    if (settings.scatteringHeader === 'true') {
        document.querySelector('.main').classList.add('scatt');
    } else {
        document.querySelector('.main').classList.remove('scatt');
    }
};

const AllDocuments = () => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);

    const lang = settings.language;

    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [currentDocs, setCurrentDocs] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // Состояние для поискового запроса
    const [isSearchActive, setIsSearchActive] = useState(false); // Состояние активности поиска
    const inputRef = useRef(null); // Создаем реф для поля ввода
    const wrapperRef = useRef(null);
    // работа с избранными
    const [selectedRows, setSelectedRows] = useState([]);
    const [lastSelectedRowId, setLastSelectedRowId] = useState(null);

    const [favorites, setFavorites] = useState([]);
    const [isSorted, setIsSorted] = useState(false);
    const [originalRows, setOriginalRows] = useState([]);
    const [isSortedByFavorites, setIsSortedByFavorites] = useState(false);

    const [selectedRowId, setSelectedRowId] = useState(null); 
    const [selectedRowColor, setSelectedRowColor] = useState(false);

    const [currentRow, setCurrentRow] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const tableRef = useRef(null);
    const ctrlPressed = useRef(false);
    const shiftPressed = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Control') {
                ctrlPressed.current = true;
            }
            if (e.key === 'Shift') {
                shiftPressed.current = true;
            }
        };
        
        const handleKeyUp = (e) => {
            if (e.key === 'Control') {
                ctrlPressed.current = false;
            }
            if (e.key === 'Shift') {
                shiftPressed.current = false;
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);


    const toggleSidebar = () => {
        setIsSidebarHidden(prevState => !prevState);
    };

    const navigate = useNavigate();
    const handleQuit = () => {
        navigate('/');
    };

    const goOpenDocs = (row) => {
        navigate(`${`/open_document/${encodeURIComponent(row.nameBottom)}?prevPage=all_documents/${encodeURIComponent(projectName)}`}`);
    }
    const handleViewClick = () => {
        if (currentRow) {
            navigate(`/open_document/${encodeURIComponent(currentRow.nameBottom)}?prevPage=all_documents/${encodeURIComponent(projectName)}`);
            handleCloseContextMenu(); // Закрыть модальное окно после перехода
        }
    };
    const [selectedList, setSelectedList] = useState('all');
    const handleSelectListHeader = (e) => {
        setSelectedList(e.target.value);
    };
    useEffect(() => {
        const filtered = currentDocs.filter(row => {
            const nameTop = row.nameTop || '';
            const nameBottom = row.nameBottom || '';
            
            // Фильтрация по поисковому запросу
            const matchesSearch = nameTop.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              nameBottom.toLowerCase().includes(searchTerm.toLowerCase());

            // Фильтрация по второму фильтру
            const selectedLists = JSON.parse(localStorage.getItem('selectedLists')) || [];
            const matchesSecondFilter = selectedList === 'all' || selectedLists.some(entry => entry[1] === selectedList && entry[0] === row.id);
            return matchesSearch && matchesSecondFilter; // Возвращаем строки, которые соответствуют обоим фильтрам
        });
        setFilteredRows(filtered);
    }, [searchTerm, currentDocs, selectedList]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    useEffect(() => {
        // Загружаем выбранный id из localStorage при монтировании компонента
        const savedSelectedRowId = JSON.parse(localStorage.getItem('selectRow'));
        if (savedSelectedRowId) {
            setSelectedRowId(savedSelectedRowId);
            setSelectedRows([savedSelectedRowId]); // Если вы используете массив для выделенных строк
        }
    }, []);

    const handleRowSelect = (id, e) => {
        e.stopPropagation();
        setSelectedRowId(id);

        localStorage.setItem('selectRow', JSON.stringify(id));

        const notes = JSON.parse(localStorage.getItem('notes'));
        if (notes && notes[id]) {
            setCurrentNote(notes[id].name);
        } else {
            setCurrentNote('');
        }

        if (e.button === 0) { // Левый клик
            if (ctrlPressed.current) {
                // Режим множественного выделения (Ctrl+Клик)
                setSelectedRows(prev => 
                    prev.includes(id) 
                        ? prev.filter(rowId => rowId !== id) 
                        : [...prev, id]
                );
            } else if (shiftPressed.current && lastSelectedRowId !== null) {
                // Режим множественного выделения (Shift+Клик)
                const currentIndex = filteredRows.findIndex(row => row.id === id);
                const lastIndex = filteredRows.findIndex(row => row.id === lastSelectedRowId);
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);
                const newSelectedRows = filteredRows.slice(start, end + 1).map(row => row.id);
                setSelectedRows(newSelectedRows);
            } else {
                // Обычный режим (одиночное выделение)
                setSelectedRows([id]);
            }
            setLastSelectedRowId(id); // Обновляем последний выбранный элемент
        } else if (e.button === 2) { // Правый клик
            // Для правого клика сбрасываем выделение левой кнопкой
            setSelectedRows([]);
        }
    };

    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);

    const toggleFavorites = () => {
        if (selectedRows.length === 0) {
            setError('Выберите минимум одну строку');
            setShowError(true);

            setTimeout(() => {
                setShowError(false);
                setError('');
            }, 3000);

            return;
        }
        const updatedFavorites = [...favorites];
        selectedRows.forEach(id => {
            if (updatedFavorites.includes(id)) {
                updatedFavorites.splice(updatedFavorites.indexOf(id), 1);
            } else {
                updatedFavorites.push(id);
            }
        });
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setSelectedRows([]); // Сброс выделения после действия
    };
    const handleSortFavorites = () => {
        if (isSortedByFavorites) {
            // Возвращаем исходный порядок
            setFilteredRows([...originalRows]);
        } else {
            // Сортируем, поднимая избранные наверх
            const sortedRows = [...filteredRows].sort((a, b) => {
                const aIsFavorite = favorites.includes(a.id);
                const bIsFavorite = favorites.includes(b.id);
                if (aIsFavorite === bIsFavorite) return 0;
                return aIsFavorite ? -1 : 1;
            });
            setFilteredRows(sortedRows);
        }
        setIsSortedByFavorites(!isSortedByFavorites);
    };
    
    // Обработчик клика по документу (вне кнопки поиска)
    const handleDocumentClick = (e) => {
        // Проверяем, был ли клик внутри кнопки поиска
        if (!e.target.closest('.btn-search')) {
            setIsSearchActive(false);
        }
        if (tableRef.current && !tableRef.current.contains(e.target)) {
            setSelectedRows([]);
            setSelectedRowId(null);
        }
    };
    // Обработчик клика по кнопке поиска
    // const handleSearchClick = () => {
    //     setIsSearchActive(true);
    //     // Устанавливаем фокус в поле ввода при активации
    //     setTimeout(() => {
    //         inputRef.current?.focus();
    //     }, 0);
    // };

    // вывод наименования проекта в хедере
    // const { projectId } = useParams();
    // const { projectName } = useParams();
    const { projectId, projectName } = useParams();
    const { token } = useAuth();
    const handleProjectSelect = async (selectedProjectId, selectedTypeId) => {
        try {
            const documents = await getDocuments(token, selectedProjectId);
            const filteredDocuments = documents.filter(doc => doc.id_type === selectedTypeId);
            const transformedDocuments = filteredDocuments.map(doc => ({
                id: doc.id,
                code: doc.code,
                version: doc.version,
                nameTop: doc.nametop,
                nameBottom: doc.name,
                created: formatDate(doc.crdate),
                createdBy: doc.cruser.name,
                edited: formatDate(doc.edit_date),
                editedBy: doc.edit_user.name,
                stage: doc.stage,
            }));
            setCurrentDocs(transformedDocuments);
            setFilteredRows(transformedDocuments); // Initialize filtered rows
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    };

    // работа со списками
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [isModalOpenAdd, setIsModalOpenAdd] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editInputValue, setEditInputValue] = useState('');
    const [newListEditName, setNewListEditName] = useState('');
    const [filteredEditLists, setFilteredEditLists] = useState([]);
    const inputEditRef = useRef();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteInputValue, setDeleteInputValue] = useState('');
    const [filteredDeleteLists, setFilteredDeleteLists] = useState([]);
    const inputDeleteRef = useRef();

    const inputListAddRef = useRef();
    useEffect(() => {
        // Загрузка списков из localStorage при монтировании компонента
        const storedLists = JSON.parse(localStorage.getItem('documentLists')) || [];
        setLists(storedLists);
    }, []);
    // добавление нового списка
    useEffect(() => {
        // Автоматический фокус при открытии модалки
        if (isModalOpenAdd && inputListAddRef.current) {
            inputListAddRef.current.focus();
        }
    }, [isModalOpenAdd]);

    const handleAddList = () => {
        if (newListName.trim() === '') return; // Проверка на пустое значение

        const newList = {
            // id: Date.now(), // Генерация уникального ID
            name: newListName,
        };
        const updatedLists = [...lists, newList];
        setLists(updatedLists);
        localStorage.setItem('documentLists', JSON.stringify(updatedLists)); // Сохранение в localStorage
        setNewListName(''); // Очистка поля ввода
        setIsModalOpenAdd(false); // Закрытие модального окна
    };
    const handleCancel = () => {
        setNewListName(''); // Очистка поля ввода
        setIsModalOpenAdd(false); // Закрытие модального окна
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddList();
        }
    };
    
    // редактирование списка
    useEffect(() => {
        // Автоматический фокус при открытии модалки
        if (isEditModalOpen && inputEditRef.current) {
            inputEditRef.current.focus();
        }
    }, [isEditModalOpen]);
    const handleEditModalOpen = () => {
        setIsEditModalOpen(true);
        setEditInputValue('');
        setNewListEditName('');
        setFilteredEditLists([]);
    };
    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditInputValue('');
        setNewListEditName('');
        setFilteredEditLists([]);
    };
    const handleEditInputChange = (e) => {
        const value = e.target.value;
        setEditInputValue(value);
        // Если поле ввода пустое, очищаем список совпадений
        if (value.trim() === '') {
            setFilteredEditLists([]);
            return;
        }
        // Фильтрация списков на основе введенного значения
        const filtered = lists.filter(list => 
            list.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredEditLists(filtered);
    };
    const handleSelectEditList = (listName) => {
        setEditInputValue(listName);
        setFilteredEditLists([]);
    };
    const handleEditListNameChange = () => {
        const oldListName = editInputValue.trim();
        const updatedListName = newListName.trim();
        if (oldListName && updatedListName) {
            const updatedLists = lists.map(list => 
                list.name === oldListName ? { ...list, name: updatedListName } : list
            );
            setLists(updatedLists);
            localStorage.setItem('documentLists', JSON.stringify(updatedLists));
            handleEditModalClose();
        }
    };

    // удаление списка
    useEffect(() => {
        // Автоматический фокус при открытии модалки
        if (isDeleteModalOpen && inputDeleteRef.current) {
            inputDeleteRef.current.focus();
        }
    }, [isDeleteModalOpen]);
    const handleDeleteModalOpen = () => {
        setIsDeleteModalOpen(true);
        setDeleteInputValue('');
        setFilteredDeleteLists([]);
    };
    const handleDeleteModalClose = () => {
        setIsDeleteModalOpen(false);
        setDeleteInputValue('');
        setFilteredDeleteLists([]);
    };
    const handleDeleteInputChange = (e) => {
        const value = e.target.value;
        setDeleteInputValue(value);
        // Если поле ввода пустое, очищаем список совпадений
        if (value.trim() === '') {
            setFilteredDeleteLists([]);
            return;
        }
        // Фильтрация списков на основе введенного значения
        const filtered = lists.filter(list => 
            list.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredDeleteLists(filtered);
    };

    const handleDeleteList = () => {
        const listToDelete = deleteInputValue.trim();
        if (listToDelete) {
            const updatedLists = lists.filter(list => list.name !== listToDelete);
            setLists(updatedLists);
            localStorage.setItem('documentLists', JSON.stringify(updatedLists));
            handleDeleteModalClose();
        }
    };
    const handleSelectList = (listName) => {
        setDeleteInputValue(listName);
        setFilteredDeleteLists([]);
    };

    // окно для работы со строками таблицы
    const [isOneBlockVisible, setIsOneBlockVisible] = useState(false);
    const [isTwoBlockVisible, setIsTwoBlockVisible] = useState(false);
    const [isThreeBlockVisible, setIsThreeBlockVisible] = useState(false);
    const [activeList, setActiveList] = useState(null); // 'all' или 'delete'

    // const [selectedRowId, setSelectedRowId] = useState(null); // ID выбранной строки
    // const [selectedRowColor, setSelectedRowColor] = useState(false);

    const [isModalOpenAddRow, setIsModalOpenAddRow] = useState(false);
    const contextMenuRef = useRef(null);

    const [newListNameRow, setNewListNameRow] = useState('');
    const [errorRow, setErrorRow] = useState(null);
    const [showErrorRow, setShowErrorRow] = useState(false);

    const closeTimerRef = useRef(null);
    const closeTimerTwoRef = useRef(null);
    const closeTimerThreeRef = useRef(null);

    const clearAllTimers = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        if (closeTimerTwoRef.current) {
            clearTimeout(closeTimerTwoRef.current);
            closeTimerTwoRef.current = null;
        }
        if (closeTimerThreeRef.current) {
            clearTimeout(closeTimerThreeRef.current);
            closeTimerThreeRef.current = null;
        }
    }

    const handleDownloadClick = () => {
        downloadExampleDocument();
        handleCloseContextMenu();
    };
    const downloadExampleDocument = () => {
        try {
            // Используем require для корректного пути в React
            const filePath = require('../../assets/documents/example_doc.pdf');
            const fileName = 'example_document.pdf';
            
            const link = document.createElement('a');
            link.href = filePath;
            link.setAttribute('download', fileName);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            setError('Не удалось скачать документ');
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
        }
    };

    const handleActiveModalRow = (e, rowId) => {
        e.preventDefault();
        setIsOneBlockVisible(true);
        setSelectedRowId(rowId);
        setSelectedRowColor(true);

        localStorage.setItem('selectRow', JSON.stringify(rowId));
        
        const rowData = filteredRows.find(row => row.id === rowId);
        setCurrentRow(rowData);

        setSelectedRows([]);

        if (window.innerWidth > 767) {
            const { clientX, clientY } = e;
            contextMenuRef.current.style.top = `${clientY}px`;
            contextMenuRef.current.style.left = `${clientX}px`;
        } else {
            contextMenuRef.current.style.top = '15%';
            contextMenuRef.current.style.left = `20%`;
        }
    }
    const handleCloseContextMenu = () => {
        setIsOneBlockVisible(false);
        setSelectedRowId(null);
    };
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOneBlockVisible && !e.target.closest('.modal-info-row')) {
                handleCloseContextMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOneBlockVisible]);

    const handleListBtnOneEnter = () => {
        clearAllTimers();
        setIsTwoBlockVisible(true);
    };
    const handleListBtnOneLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setIsTwoBlockVisible(false);
        }, 300);
    };
    const handleTwoBlockEnter = () => {
        clearAllTimers();
        setIsTwoBlockVisible(true);
    }
    const handleTwoBlockLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setIsTwoBlockVisible(false);
        }, 300);
    }
    const handleAddInBtnEnter = () => {
        clearAllTimers();
        setActiveList('all');
        setIsThreeBlockVisible(true);
    };
    const handleAddInBtnLeave = () => {
        closeTimerTwoRef.current = setTimeout(() => {
            setIsThreeBlockVisible(false);
        }, 300);
    };
    const handleDeleteFromBtnEnter = () => {
        clearAllTimers();
        setActiveList('delete');
        setIsThreeBlockVisible(true);
    };
    const handleDeleteFromBtnLeave = () => {
        closeTimerTwoRef.current = setTimeout(() => {
            setIsThreeBlockVisible(false);
        }, 300);
    };
    const handleThreeBlockEnter = () => {
        clearAllTimers();
        setIsThreeBlockVisible(true);
    }
    const handleThreeBlockLeave = () => {
        closeTimerThreeRef.current = setTimeout(() => {
            setIsThreeBlockVisible(false);
        }, 300);
    };

    // const modalInfoErrorAdd = '';
    const handleAddToList = (listName) => {
        const selectedLists = JSON.parse(localStorage.getItem('selectedLists')) || [];
        const existingEntry = selectedLists.find(entry => entry[0] === selectedRowId);
        if (existingEntry) {
            // Если запись уже существует, добавляем новое название списка
            if (!existingEntry.includes(listName)) {
                existingEntry.push(listName);
            }
        } else {
            // Если записи нет, создаем новую
            selectedLists.push([selectedRowId, listName]);
        }
        localStorage.setItem('selectedLists', JSON.stringify(selectedLists));
        handleCloseContextMenu();
    };

    const handleDeleteFromList = (listName) => {
        const selectedLists = JSON.parse(localStorage.getItem('selectedLists')) || [];
        const entryIndex = selectedLists.findIndex(entry => entry[0] === selectedRowId);
        
        if (entryIndex !== -1) {
            const entry = selectedLists[entryIndex];
            
            // Удаляем название списка из массива
            const listNameIndex = entry.indexOf(listName);
            if (listNameIndex !== -1) {
                entry.splice(listNameIndex, 1);
                
                // Если после удаления остался только ID, удаляем всю запись
                if (entry.length === 1) {
                    selectedLists.splice(entryIndex, 1);
                }
                
                localStorage.setItem('selectedLists', JSON.stringify(selectedLists));
            }
        }
        handleCloseContextMenu();
    };

    const [idRowForAddInNewList, setIdRowForAddInNewList] = useState();
    const [listsSelectLists, setListsSelectLists] = useState([]);

    const handleAddInNewList = () => {
        setIdRowForAddInNewList(selectedRowId);
        console.log(idRowForAddInNewList);
        setIsModalOpenAddRow(true);
    }

    const handleAddNewList = () => {
        const newListAddInValue = {
            name: newListNameRow,
        };

        // Получаем текущие списки из localStorage
        const selectedLists = JSON.parse(localStorage.getItem('selectedLists')) || [];

        // Проверяем, существует ли уже запись с idRowForAddInNewList
        const existingEntry = selectedLists.find(entry => entry[0] === idRowForAddInNewList);

        if (existingEntry) {
            // Если запись уже существует, добавляем новое название списка
            if (!existingEntry.includes(newListNameRow)) {
                existingEntry.push(newListNameRow);
            }
        } else {
            // Если записи нет, создаем новую
            selectedLists.push([idRowForAddInNewList, newListNameRow]);
        }

        // Сохраняем обновленный список в localStorage
        localStorage.setItem('selectedLists', JSON.stringify(selectedLists));

        // Обновляем состояние listsSelectLists
        const updatedListDoc = { ...listsSelectLists, [idRowForAddInNewList]: newListAddInValue };
        setListsSelectLists(updatedListDoc);

        // Обновляем состояние lists
        const newList = {
            name: newListNameRow,
        };
        const updatedListsDoc2 = [...lists, newList];
        setLists(updatedListsDoc2);
        localStorage.setItem('documentLists', JSON.stringify(updatedListsDoc2));

        // Сбрасываем состояние ввода и закрываем модальное окно
        setNewListNameRow('');
        setIsModalOpenAddRow(false);
    };

    


    
    const colorsRow = ['#FFF7AD', '#FFD1D6', '#FFB0B0', '#84f5edff', '#f7ecb8ff', '#bba1ecff', '#98f598'];
    const [colorRow, setColorRow] = useState(null);
    
    const handleChangeColorRow = (color) => {
        const colorRows = JSON.parse(localStorage.getItem('colorsRow')) || {};
        colorRows[selectedRowId] = color;
        localStorage.setItem('colorsRow', JSON.stringify(colorRows));
        setColorRow(color);
        handleCloseContextMenu();
    };
    const getRowColor = (rowId) => {
        const colorRows = JSON.parse(localStorage.getItem('colorsRow')) || {};
        return colorRows[rowId] || '';
    };
    const deleteColorRow = () => {
        if (selectedRowId === null) return; // Если нет выбранной строки, ничего не делаем
        // Получаем текущие цвета из localStorage
        const colorRows = JSON.parse(localStorage.getItem('colorsRow')) || {};
        // Удаляем цвет для выбранной строки
        delete colorRows[selectedRowId];
        // Сохраняем обновленные цвета в localStorage
        localStorage.setItem('colorsRow', JSON.stringify(colorRows));
        // Обновляем состояние цвета
        setColorRow(null); // Сбрасываем состояние цвета
        handleCloseContextMenu();
    };

    const [panelIsActive, setPanelIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState('one');
    const handlePanel = () => {
        setPanelIsActive(prev => !prev); // Переключаем состояние панели
    };
    const handleTabClick = (tab) => {
        setActiveTab(tab); // Устанавливаем активный таб
        setPanelIsActive(true); // Убедитесь, что панель активна
    };

    const [modalOpenDoc, setModalOpenDoc] = useState(false);
    const handleOpenDoc = () => {
        setModalOpenDoc(true);
    };
    const handleCloseDoc = () => {
        setModalOpenDoc(false);
    };

    const [modalNote, setModalNote] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [currentNote, setCurrentNote] = useState('');
    const [notes, setNotes] = useState({});
    const [idRowForNode, setIdRowForNode] = useState();
    const inputAddNoteRef = useRef();

    useEffect(() => {
        const savedNotes = JSON.parse(localStorage.getItem('notes')) || {};
        setNotes(savedNotes);
    }, []);

    const openAddNote = () => {
        setIdRowForNode(selectedRowId);
        setModalNote(true);
    };
    const closeNoteToDoc = () => {
        setModalNote(false);
        setNewNote('');
    };
    useEffect(() => {
        // Автоматический фокус при открытии модалки
        if (modalNote && inputAddNoteRef.current) {
            inputAddNoteRef.current.focus();
        }
    }, [modalNote]);
    const addNoteToDoc = () => {
        const newNoteValue = {
            name: newNote,
        };
        const updatedNotes = { ...notes, [idRowForNode]: newNoteValue };
        setNotes(updatedNotes);
        localStorage.setItem('notes', JSON.stringify(updatedNotes));

        setIdRowForNode('');
        setNewNote('');
        setModalNote(false);
    };
    
    // const [ hintActiveOne, setHintActiveOne] = useState(false);
    // const changeActiveHintOne = () => {
    //     setHintActiveOne(true);
    // };
    // const changeNoActiveHintOne = () => {
    //     setHintActiveOne(false);
    // };
    // const [ hintActiveTwo, setHintActiveTwo] = useState(false);
    // const changeActiveHintTwo = () => {
    //     setHintActiveTwo(true);
    // };
    // const changeNoActiveHintTwo = () => {
    //     setHintActiveTwo(false);
    // };
    const [hintsActive, setHintsActive] = useState({
        history: false,
        favorites: false,
        add: false,
        edit: false,
        delete: false,
    });
    const changeActiveHint = (hint) => {
        setHintsActive((prev) => ({ ...prev, [hint]: true }));
    };
    const changeNoActiveHint = (hint) => {
        setHintsActive((prev) => ({ ...prev, [hint]: false }));
    };


    console.log(projectName);
    console.log(projectId);
    
    return (
        <>
            <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
                <div className="resize-handle"></div>
                <button
                    id="hidden-sidebar"
                    onClick={toggleSidebar}
                >
                    <img src={require('../../assets/icons/btn-sidebar.png')} alt="" />
                </button>

                <Link to={`/settings?prevPage=all_documents/${encodeURIComponent(projectName)}`} state={projectName} id="btn-settings-mobile">
                    <img src={require('../../assets/icons/settings.png')} alt="Выйти" />
                </Link>

                <Link to='/home' id="button-back">
                    <img src={require('../../assets/icons/arrow.png')} alt="Назад" />
                </Link>

                <Link to="/home" className='sidebar-logo'>
                    <div className="sidebar-logo-image">
                        <div className="sidebar-logo-image-item">
                            <div className="sidebar-logo-image-item-nosquare"></div>
                        </div>
                        <div className="sidebar-logo-image-item">
                            <div className="sidebar-logo-image-item-line"></div>
                        </div>
                        <div className="sidebar-logo-image-item">
                            <div className="sidebar-logo-image-item-square"></div>
                        </div>
                    </div>
                    <div className="sidebar-logo-text">DMT<br />Base</div>
                </Link>
    
                <div className="sidebar-user-image">    
                    <img src={require('../../assets/images/user.png')} alt="" />
                </div>
                <div className='sidebar-userName-dataBase'>
                    <div className="sidebar-name styled-text">Имя пользователя</div>

                    <NameDatabase />
                    {/* <div className="sidebar-name-dataBase styled-subtext">DATA Base -test</div> */}
                </div>

                <div className="sidebar-panel">
                    <div className="sidebar-panel-item">
                        <button className="sidebar-panel-item-btn">
                            <img src={require('../../assets/icons/chevron.png')} alt="" />
                        </button>
                    </div>
                    <div className="sidebar-panel-item">
                        {/*<button className="sidebar-panel-item-btn all">
                            <img src={require('../../assets/icons/btn-sidebar.png')} alt="" />
                        </button> */}
                        {/* <button
                            className={`sidebar-panel-item-btn history ${hintsActive.history ? 'active' : ''}`} 
                            onMouseEnter={() => changeActiveHint('history')}
                            onMouseLeave={() => changeNoActiveHint('history')}
                        >
                            <img src={require('../../assets/icons/history.png')} alt="" />
                            <div className="sidebar-panel-item-btn-hint">
                                История
                            </div>
                        </button>
                        <button
                            className={`sidebar-panel-item-btn favorites ${hintsActive.favorites  ? 'active' : ''}`} 
                            onMouseEnter={() => changeActiveHint('favorites ')}
                            onMouseLeave={() => changeNoActiveHint('favorites ')}
                        >
                            <img className="fav1" src={require('../../assets/icons/star.png')} alt="" />
                            <img className="fav2" src={require('../../assets/icons/star_fav.png')} alt="" />
                            <div className="sidebar-panel-item-btn-hint">Избранное</div>
                        </button> */}
                        <button
                            className={`sidebar-panel-item-btn history ${hintsActive.history ? 'active' : ''}`} 
                            onMouseEnter={() => changeActiveHint('history')}
                            onMouseLeave={() => changeNoActiveHint('history')}
                        >
                            <img src={require('../../assets/icons/history.png')} alt="" />
                            {hintsActive.history && <div className="sidebar-panel-item-btn-hint">История</div>}
                        </button>
                        <button
                            className={`sidebar-panel-item-btn favorites ${hintsActive.favorites ? 'active' : ''}`} 
                            onMouseEnter={() => changeActiveHint('favorites')}
                            onMouseLeave={() => changeNoActiveHint('favorites')}
                        >
                            <img className="fav1" src={require('../../assets/icons/star.png')} alt="" />
                            <img className="fav2" src={require('../../assets/icons/star_fav.png')} alt="" />
                            {hintsActive.favorites && <div className="sidebar-panel-item-btn-hint">Избранное</div>}
                        </button>
                    </div>
                </div>
    
                <div className="sidebar-menu active">
                    <ul>
                        {/* <ProjectTree />  */}
                        {/* <ProjectTree projectId={projectId} /> */}
                        <ProjectTree projectId={projectId} onProjectSelect={handleProjectSelect} />
                    </ul>
                </div>
            </div>

            <button id="btn-quit" onClick={handleQuit}>
                <img src={require('../../assets/icons/quit.png')} alt="Выйти" />
            </button>

            {isModalOpenAdd && (
                <div className="modal-add-list">
                    <div className="modal-add-list-content">
                        <div className="modal-title">Новый список</div>
                        <div className="modal-text">Введите название нового списка</div>
                        <input
                            type="text"
                            id="new-list"
                            autoComplete="off"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            ref={inputListAddRef}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="modal-btns">
                            <button id="modal-btn-add-list" onClick={handleAddList} disabled={!newListName.trim()}>
                                {lang === 'ru' ? 'ОК' : 'OK'}
                            </button>
                            <button id="modal-btn-add-cancel" onClick={handleCancel}>
                                {lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="modal-edit-list">
                    <div className="modal-edit-list-content">
                        <div className="modal-title">Редактировать список</div>
                        <div className="modal-text">Введите название списка, который хотите изменить</div>
                        <div className="modal-input-all-list">
                            <input
                                type="text"
                                id="edit-all-list"
                                autocomplete="off"
                                value={editInputValue}
                                onChange={handleEditInputChange}
                                ref={inputEditRef}
                            />
                            <div className="edit-all" style={{ display: filteredEditLists.length > 0 ? 'block' : 'none' }}>
                                {/* <div className="edit-list-all-item">Все</div> */}
                                {filteredEditLists.map((list) => (
                                    <div 
                                        key={list.id} 
                                        className="edit-list-all-item" 
                                        onClick={() => handleSelectEditList(list.name)}
                                    >
                                        {list.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-text">Введите новое название списка</div>
                        <div className="modal-input-edit-list">
                            <input
                                type="text"
                                id="edit-list"
                                autocomplete="off"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                            />
                        </div>
                        
                        <div className="modal-btns">
                            <button id="modal-btn-edit-list" onClick={handleEditListNameChange}>
                                {lang === 'ru' ? 'ОК' : 'OK'}
                            </button>
                            <button id="modal-btn-edit-cancel" onClick={handleEditModalClose}>
                                {lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {isDeleteModalOpen && (
                <div className="modal-delete-list">
                    <div className="modal-delete-list-content">
                        <div className="modal-title">Удалить список</div>
                        <div className="modal-text">Введите название списка, который хотите удалить</div>
                        <div className="modal-input">
                            <input
                                type="text"
                                id="old-list"
                                autocomplete="off"
                                value={deleteInputValue}
                                onChange={handleDeleteInputChange}
                                ref={inputDeleteRef}
                            />
                            <div className="old-list-all" style={{ display: filteredDeleteLists.length > 0 ? 'block' : 'none' }}>
                                {/* <div className="old-list-all-item">Все</div> */}
                                {filteredDeleteLists.map((list) => (
                                    <div 
                                        key={list.id} 
                                        className="old-list-all-item" 
                                        onClick={() => handleSelectList(list.name)}
                                    >
                                        {list.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-btns">
                            <button id="modal-btn-delete-list" onClick={handleDeleteList}>
                                {lang === 'ru' ? 'ОК' : 'OK'}
                            </button>
                            <button id="modal-btn-delete-cancel" onClick={handleDeleteModalClose}>
                                {lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showError && (
                <div className={`error-modal active`}>
                    <div className="error-modal-content">
                        <div className="error-modal-title styled-text">Ошибка</div>
                        <div className="error-modal-text styled-text">{error}</div>
                    </div>
                </div>
            )}
    
            <div className="main_content all_doc" onClick={handleDocumentClick} ref={wrapperRef}>
                <div className="main_content-header">
                    <div className="main_content-header-item one">
                        <span className="main_content-header-item-title styled-text">{decodeURIComponent(projectName)}</span>
                    </div>
                    <div className="scattering"></div>

                    <div className="main_content-header-item two">

                        <div className="list">
                            <div className="list-label">
                                <label htmlFor="select-list" className="styled-text">
                                    {lang === 'ru' ? 'Список' : 'List'}
                                </label>
                                <select id="select-list" className="select-list styled-text" onChange={handleSelectListHeader} value={selectedList}>
                                    <option value="all">
                                        {lang === 'ru' ? 'Все' : 'All'}
                                    </option>
                                    {lists.map((list) => (
                                        <option key={list.id} value={list.name}>
                                            {list.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="list-btns">
                                <button
                                    className={`list-btn ${hintsActive.add ? 'active' : ''}`} 
                                    id="btn-list-add"
                                    onMouseEnter={() => changeActiveHint('add')}
                                    onMouseLeave={() => changeNoActiveHint('add')}
                                    onClick={() => setIsModalOpenAdd(true)}
                                >
                                    <img src={require('../../assets/icons/plus.png')} alt="" />
                                    {hintsActive.add && <div className="list-btn-hint">Создать список</div>}
                                </button>
                                <button
                                    className={`list-btn ${hintsActive.edit ? 'active' : ''}`} 
                                    id="btn-list-edit"
                                    onMouseEnter={() => changeActiveHint('edit')}
                                    onMouseLeave={() => changeNoActiveHint('edit')}
                                    onClick={handleEditModalOpen}
                                >
                                    <img src={require('../../assets/icons/edit.png')} alt="" />
                                    {hintsActive.edit && <div className="list-btn-hint">Редактировать список</div>}
                                </button>
                                <button
                                    className={`list-btn ${hintsActive.delete ? 'active' : ''}`} 
                                    id="btn-list-delete"
                                    onMouseEnter={() => changeActiveHint('delete')}
                                    onMouseLeave={() => changeNoActiveHint('delete')}
                                    onClick={handleDeleteModalOpen}
                                >
                                    <img src={require('../../assets/icons/delete.png')} alt="" />
                                    {hintsActive.delete && <div className="list-btn-hint">Удалить список</div>}
                                </button>
                            </div>
                        </div>

                        <div className="main-btns">
                            <button 
                                id="btn-search"
                                className={`btn-search ${isSearchActive ? 'active' : ''}`}
                                // onClick={handleSearchClick}
                            >
                                <img src={require('../../assets/icons/search.png')} alt="" />
                                <input 
                                    type="text"
                                    id="input-search"
                                    className="styled-text"
                                    placeholder="Найти..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    ref={inputRef}
                                />
                            </button>

                            <button id="btn-favorite" onClick={toggleFavorites}>
                                <img className="btn-favorite-star-nofav active" src={require('../../assets/icons/star.png')} alt="" />
                                <img className="btn-favorite-star-fav" src={require('../../assets/icons/star_fav.png')} alt="" />
                            </button>

                            <Link to={`/settings?prevPage=all_documents/${encodeURIComponent(projectName)}`} state={projectName} id="btn-settings">
                                <img src={require('../../assets/icons/settings.png')} alt="" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={`modal-info-row ${isOneBlockVisible ? 'active' : ''}`} ref={contextMenuRef}>
                    {/* Основной блок - всегда видим */}
                    <div className="modal-info-row-card one">
                        <div className="modal-info-row-card-item" onClick={handleViewClick}>{lang === 'ru' ? 'Посмотреть' : 'View'}</div>
                        <div className="modal-info-row-card-item" onClick={handleDownloadClick}>{lang === 'ru' ? 'Скачать' : 'Download'}</div>
                        <div className="modal-info-row-card-item" onClick={openAddNote}>{lang === 'ru' ? 'Примечание' : 'Note'}</div>
                        <div 
                            className="modal-info-row-card-item one"
                            onMouseEnter={handleListBtnOneEnter}
                            onMouseLeave={handleListBtnOneLeave}
                        >
                            <span>
                                {lang === 'ru' ? 'Список' : 'List'}
                                <img src={require('../../assets/icons/chevron.png')} alt="" />
                            </span>
                        </div>
                        <div className="modal-info-row-card-item colors">
                            {/* Цвета */}
                            <div className="color-item" style={{backgroundColor: '#fff'}} onClick={deleteColorRow}></div>
                            {colorsRow.map((color) => (
                                <div key={color} className="color-item" style={{backgroundColor: color}} onClick={() => handleChangeColorRow(color)}></div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Второй блок - появляется при наведении на "Список" */}
                    <div
                        className="modal-info-row-card two"
                        onMouseEnter={handleTwoBlockEnter}
                        onMouseLeave={handleTwoBlockLeave}
                    >
                        <div className={`modal-info-row-card-cont two ${isTwoBlockVisible ? 'visible' : ''}`}>
                            <div
                                className="modal-info-row-card-item add"
                                onMouseEnter={handleAddInBtnEnter}
                                onMouseLeave={handleAddInBtnLeave}
                            >
                                {lang === 'ru' ? 'Добавить в' : 'Add to'}
                            </div>
                            <div
                                className="modal-info-row-card-item remove"
                                onMouseEnter={handleDeleteFromBtnEnter}
                                onMouseLeave={handleDeleteFromBtnLeave}
                            >
                                {lang === 'ru' ? 'Удалить из' : 'Delete from'}
                            </div>
                            {/* <div className="modal-info-row-card-item" onClick={() => setIsModalOpenAddRow(true)}>{lang === 'ru' ? 'Добавить в новый список' : 'Add to a new list'}</div> */}
                            <div className="modal-info-row-card-item" onClick={handleAddInNewList}>{lang === 'ru' ? 'Добавить в новый список' : 'Add to a new list'}</div>
                        </div>

                        <div
                            className={`modal-info-row-card three ${isThreeBlockVisible ? 'visible' : ''}`}
                            onMouseEnter={handleThreeBlockEnter}
                            onMouseLeave={handleThreeBlockLeave}
                        >
                            <div className={`modal-info-row-card-three-item all ${activeList === 'all' ? 'active' : ''}`}>
                                {lists.map((list) => (
                                    <span
                                        // key={list.id}
                                        key={list.name}
                                        value={list.name}
                                        className='modal-info-row-card-item'
                                        onClick={() => handleAddToList(list.name)}
                                    >
                                        {list.name}
                                    </span>
                                ))}
                            </div>
                            <div className={`modal-info-row-card-three-item delete ${activeList === 'delete' ? 'active' : ''}`}>
                                {selectedRowId ? (
                                    JSON.parse(localStorage.getItem('selectedLists'))?.filter(entry => entry[0] === selectedRowId).map(entry => (
                                        entry.slice(1).map(name => (
                                            <div key={name} className="modal-info-row-card-item" onClick={() => handleDeleteFromList(name)}>
                                                {name}
                                            </div>
                                        ))
                                    ))
                                ) : (
                                    <div className="modal-info-row-card-item">Нет списков для удаления</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                </div>
                {isModalOpenAddRow && (
                    <div className="modal-add-list">
                        <div className="modal-add-list-content">
                            <div className="modal-title">Новый список</div>
                            <div className="modal-text">Введите название нового списка</div>
                            <input
                                type="text"
                                id="new-list"
                                autoComplete="off"
                                value={newListNameRow}
                                onChange={(e) => setNewListNameRow(e.target.value)}
                                ref={inputListAddRef}
                            />
                            {showErrorRow && <div style={{color: 'red', width: '100%', textAlign: 'center'}}>{errorRow}</div>}
                            <div className="modal-btns">
                                <button id="modal-btn-add-list" onClick={handleAddNewList} disabled={!newListNameRow.trim()}>
                                    {lang === 'ru' ? 'ОК' : 'OK'}
                                </button>
                                <button id="modal-btn-add-cancel" onClick={() => setIsModalOpenAddRow(false)}>
                                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {modalNote && (
                    <div className="modal-add-note">
                        <div className="modal-add-note-content">
                            <div className="modal-text">Введите примечание</div>
                            <textarea
                                name=""
                                id="new-note"
                                rows={3}
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                ref={inputAddNoteRef}
                            ></textarea>
                            <div className="modal-btns">
                                <button id="modal-btn-note-list" onClick={addNoteToDoc}>
                                    {lang === 'ru' ? 'ОК' : 'OK'}
                                </button>
                                <button id="modal-btn-note-cancel" onClick={closeNoteToDoc}>
                                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                    
                

                <div className="main_content-table noblur">
                    <table ref={tableRef}>
                        <thead>
                            <tr>
                                <th className="col-star" onClick={handleSortFavorites}>
                                    <img className="fav-star-in-table thead" src={require('../../assets/icons/star_fav.png')} alt="" />
                                </th>
                                <th className="cell-row-small styled-text">
                                    {lang === 'ru' ? 'ID' : 'ID'}
                                </th>
                                <th className="styled-text">
                                    {lang === 'ru' ? 'Шифр' : 'Code'}
                                </th>
                                <th className="cell-row-small styled-text">
                                    {lang === 'ru' ? 'Вер. внутр.' : 'Internal version'}
                                </th>
                                <th className="styled-text">
                                    {lang === 'ru' ? 'Название верхнее' : 'Upper name'}
                                </th>
                                <th className="styled-text">
                                    {lang === 'ru' ? 'Название нижнее' : 'Lower name'}
                                </th>
                                <th className="cell-row-small styled-text">
                                    {lang === 'ru' ? 'Создан' : 'Created'}
                                </th>
                                <th className="styled-text">
                                    {lang === 'ru' ? 'Кем создан' : 'By whom created'}
                                </th>
                                <th className="cell-row-small styled-text">
                                    {lang === 'ru' ? 'Редактирован' : 'Edited'}
                                </th>
                                <th className="styled-text">
                                    {lang === 'ru' ? 'Кем редактирован' : 'By whom edited'}
                                </th>
                            </tr>
                        </thead>
                        <tbody id="table-body">
                            {filteredRows.map(row => (
                                <tr 
                                    key={row.id} 
                                    className={`table-body-row 
                                        ${selectedRows.includes(row.id) ? 'selected' : ''} 
                                        ${selectedRowId === row.id ? 'selected' : ''}
                                    `}
                                    onClick={(e) => handleRowSelect(row.id, e)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        handleActiveModalRow(e, row.id);
                                    }}
                                    style={{ backgroundColor: getRowColor(row.id) }}
                                    onDoubleClick={() => goOpenDocs(row)}
                                    
                                >
                                    <td className="col-star">
                                        {favorites.includes(row.id) && (
                                            <img src={require('../../assets/icons/star_fav.png')} alt="Избранное" />
                                        )}
                                    </td>
                                    <td className="cell-row-small styled-text">{row.id}</td>
                                    <td className="styled-text">{row.code}</td>
                                    <td className="cell-row-small styled-text">{row.version}</td>
                                    <td className="styled-text">{row.nameTop}</td>
                                    <td className="styled-text">{row.nameBottom}</td>
                                    <td className="cell-row-small styled-text">{row.created}</td>
                                    <td className="styled-text">{row.createdBy}</td>
                                    <td className="cell-row-small styled-text">{row.edited}</td>
                                    <td className="styled-text">{row.editedBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {modalOpenDoc && (
                    <div className="modal-open-doc">
                        <div className="modal-open-doc-content">
                            <div className="modal-open-doc-header styled-text">Название. Какой-то текст</div>
                            <div className="modal-open-doc-main">
                                <iframe src={require('../../assets/documents/example_doc.pdf')} frameborder="0"></iframe>
                            </div>
                            <button id="modal-open-doc-btn" onClick={handleCloseDoc}>x</button>
                        </div>
                    </div>
                )}

                <div className={`main_content-panel visible-panel ${panelIsActive ? 'active' : '' }`}>
                    <div className="main_content-panel-header">
                        <div className="main_content-panel-header-item">
                            <span
                                className={`main_content-panel-header-item-title one ${panelIsActive && activeTab === 'one' ? 'active' : ''}`} 
                                onClick={() => handleTabClick('one')}
                            >
                                {lang === 'ru' ? 'История' : 'History'}
                            </span>
                            <span
                                className={`main_content-panel-header-item-title two ${panelIsActive && activeTab === 'two' ? 'active' : ''}`} 
                                onClick={() => handleTabClick('two')}
                            >
                                {lang === 'ru' ? 'Версии' : 'Versions'}
                            </span>
                            <span
                                className={`main_content-panel-header-item-title three ${panelIsActive && activeTab === 'three' ? 'active' : ''}`} 
                                onClick={() => handleTabClick('three')}
                            >
                                {lang === 'ru' ? 'Примечание' : 'Note'}
                            </span>
                        </div>
                        <div className="main_content-panel-header-item">
                            <button id="btn-main-panel" onClick={handlePanel}>
                                <img src={require('../../assets/icons/chevron2.png')} alt="" />  
                            </button>
                        </div>
                        <div className="main_content-panel-header-item"></div>
                    </div>

                    <div className={`main_content-panel-content ${activeTab === 'one' ? 'history' : ''}`}>
                        <div className={`main_content-panel-content-item one ${activeTab === 'one' ? 'active' : ''}`}>
                            <table>
                                <thead>
                                    <tr>
                                        <th className="main-panel-row styled-subtext">#</th>
                                        <th className="main-panel-row styled-subtext">Когда</th>
                                        <th className="main-panel-row styled-subtext">Размер</th>
                                        <th className="main-panel-row styled-subtext">Расширение</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr onDoubleClick={handleOpenDoc}>
                                        <td className="main-panel-row styled-subtext">3</td>
                                        <td className="main-panel-row styled-subtext">date</td>
                                        <td className="main-panel-row styled-subtext">text</td>
                                        <td className="main-panel-row styled-subtext">text</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={`main_content-panel-content-item two ${activeTab === 'two' ? 'active' : ''}`}>
                            <table>
                                <thead>
                                    <tr>
                                        <th className="main-panel-row styled-text">ID</th>
                                        <th className="main-panel-row styled-text">Вер. внутр.</th>
                                        <th className="main-panel-row styled-text">Вер. внеш.</th>
                                        <th className="main-panel-row styled-text">Передан</th>
                                        <th className="main-panel-row styled-text">Шифр</th>
                                        <th className="main-panel-row styled-text">Название верхнее</th>
                                        <th className="main-panel-row styled-text">Название нижнее</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr onDoubleClick={handleOpenDoc}>
                                        <td className="main-panel-row styled-text">1</td>
                                        <td className="main-panel-row styled-text">0</td>
                                        <td className="main-panel-row styled-text">0</td>
                                        <td className="main-panel-row styled-text">text</td>
                                        <td className="main-panel-row styled-text">text</td>
                                        <td className="main-panel-row styled-text" title="Наименование длинное наименование">Наименование длинное наименование</td>
                                        <td className="main-panel-row styled-text" title="Наименование">Наименование</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={`main_content-panel-content-item three ${activeTab === 'three' ? 'active' : ''}`}>
                            {/* <span className="styled-text">{currentNote || 'Нет примечания'}</span> */}
                            <span className="styled-text">{currentNote || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );        
};

export default AllDocuments;