import React, { useEffect, useRef, useState, version } from 'react';
import './AllDocuments.css';
import { Link, useHref, useNavigate, useParams } from 'react-router-dom';
import ProjectTree from '../../components/ProjectTree/ProjectTree';
import NameDatabase from '../../components/NameDatabase/NameDatabase';
import { getDocuments, getDocumentVersions } from '../../api';
import { useAuth } from '../../AuthContext';
import NameUser from '../../components/NameUser/NameUser';
import FavoritesTree from '../../components/FavoritesTree/FavoritesTree';

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
    columsTable: ['id', 'code', 'version_ext', 'nameTop', 'nameBottom', 'created', 'whomCreated', 'edited', 'whomEdited']
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

    if (settings.borderTable === 'true') {
        document.querySelector('.main-table').setAttribute('border', 1);
    } else {
        document.querySelector('.main-table').removeAttribute('border');
    }

    if (settings.blurBg === 'blur') {
        document.querySelector('.main').classList.add('blur');
    } else {
        document.querySelector('.main').classList.remove('blur');
    }
};

const AllDocuments = () => {
    const [settings, setSettings] = useState(loadSettings());
    useEffect(() => {
        applySettings(settings);
    }, [settings]);
    const lang = settings.language;
    document.title = `DMT Base | ${lang === 'ru' ? 'Все документы' : 'All documents'}`;

    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarHidden(prevState => !prevState);
    };

    const [filterSource, setFilterSource] = useState('tree'); // 'tree' или 'history'
    const [selectedFilterIds, setSelectedFilterIds] = useState([]); // массив id_type для фильтрации
    const [filteredRows, setFilteredRows] = useState([]);
    const { projectId, projectName } = useParams();
    const { token } = useAuth();

    const navigate = useNavigate();
    const handleQuit = () => {
        navigate('/');
        localStorage.setItem('selectTreeDocs', JSON.stringify(''));
    };

    const handleRowDoubleClick = (row) => {
        addToHistoryList(row);
        navigate(`/open_document/${encodeURIComponent(row.nameBottom)}?documentId=${row.id}&prevPage=all_documents/${encodeURIComponent(projectId)}/${encodeURIComponent(projectName)}`);
    };
    const handleViewClick = () => {
        if (currentRow) {
            addToHistoryList(currentRow);
            navigate(`/open_document/${encodeURIComponent(currentRow.nameBottom)}?documentId=${currentRow.id}&prevPage=all_documents/${encodeURIComponent(projectId)}/${encodeURIComponent(projectName)}`);
            handleCloseContextMenu();
        }
    };

    const linkSettings = () => {
        navigate(`/settings?prevPage=all_documents/${encodeURIComponent(projectId)}/${encodeURIComponent(projectName)}`);
    };
    const buttonBack = () => {
        localStorage.setItem('selectTreeDocs', JSON.stringify(''));
        localStorage.setItem('selectRow', JSON.stringify(''));
    }
    
    // отображение колонок
    const desktopColumns = settings.columsTable || defaultSettings.columsTable;
    const mobileColumns = ['id', 'nameBottom', 'nameTop', 'code', 'version_ext', 'created', 'whomCreated', 'edited', 'whomEdited'];

    // const [selectedColumns, setSelectedColumns] = useState(settings.columsTable || defaultSettings.columsTable);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        if (window.innerWidth < 768) {
            // Для мобильных устройств
            // Можно фильтровать mobileColumns, чтобы оставить только те, что есть в настройках
            return mobileColumns.filter(col => desktopColumns.includes(col));
        } else {
            return desktopColumns;
        }
    });
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSelectedColumns(mobileColumns.filter(col => desktopColumns.includes(col)));
        } else {
            setSelectedColumns(desktopColumns);
        }
    }, [desktopColumns]);
    // Маппинг ключей колонок к заголовкам (учитываем lang)
    const columnLabels = {
        id: lang === 'ru' ? 'ID' : 'ID',
        code: lang === 'ru' ? 'Шифр' : 'Code',
        version: lang === 'ru' ? 'Вер. внутр.' : 'Internal version',
        version_ext: lang === 'ru' ? 'Вер. внеш.' : 'External version',
        nameTop: lang === 'ru' ? 'Название верхнее' : 'Upper name',
        nameBottom: lang === 'ru' ? 'Название нижнее' : 'Lower name',
        created: lang === 'ru' ? 'Создан' : 'Created',
        whomCreated: lang === 'ru' ? 'Кем создан' : 'By whom created',
        edited: lang === 'ru' ? 'Редактирован' : 'Edited',
        whomEdited: lang === 'ru' ? 'Кем редактирован' : 'By whom edited',
        sheet: lang === 'ru' ? 'Лист' : 'Sheet',
        size: lang === 'ru' ? 'Размер' : 'Size',
        status: lang === 'ru' ? 'Статус' : 'Status',
    };
    // Маппинг ключей колонок к рендеру ячеек
    const columnRenderers = {
        id: row => row.id,
        code: row => row.code,
        version: row => row.version || '-',
        version_ext: row => row.version_ext || '-',
        nameTop: row => row.nameTop,
        nameBottom: row => row.nameBottom,
        created: row => row.created,
        whomCreated: row => row.createdBy,
        edited: row => row.edited,
        whomEdited: row => row.editedBy,
        sheet: row => row.sheet,
        size: row => row.size,
        status: row => row.status,
    };

    const [allRows, setAllRows] = useState([]);

    useEffect(() => {
        const load = async () => {
            const documents = await getDocuments(token, projectId);
            const transformed = documents.map(doc => ({
                id: doc.id,
                id_type: doc.id_type,
                id_common: doc.id_common,
                code: doc.code,
                // version_ext: doc.version_ext || '-',
                version: doc.version || '-',  // ← Добавьте, если API имеет doc.version
                version_ext: doc.version_ext != null ? doc.version_ext : '-',
                nameTop: doc.nametop,
                nameBottom: doc.name,
                created: formatDate(doc.crdate),
                createdBy: doc.cruser.name,
                edited: formatDate(doc.edit_date),
                editedBy: doc.edit_user.name,
                comments: doc.comments,
            }));
            setAllRows(transformed);
        };
        load();
    }, [token, projectId]);

    useEffect(() => {
        if (filterSource === 'tree' || filterSource === 'history' || filterSource === 'favorites') {
            if (selectedFilterIds.length === 0) {
                setFilteredRows(allRows);
            } else {
                setFilteredRows(allRows.filter(row => selectedFilterIds.includes(row.id_type)));
            }
        }
    }, [filterSource, selectedFilterIds, allRows]);


    const handleProjectSelect = async (selectedIds) => {
        setFilterSource('tree');
        setSelectedFilterIds(selectedIds);
        // await loadAllDocuments(selectedIds);
        setIsHistoryActive(false); // сброс сортировки по истории при смене ветки
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    };

    // работа со списками
    const [lists, setLists] = useState([]);

    const [searchTerm, setSearchTerm] = useState(''); // Состояние для поискового запроса
    const [isSearchActive, setIsSearchActive] = useState(false); // Состояние активности поиска
    const inputRef = useRef(null); // Создаем реф для поля ввода
    const wrapperRef = useRef(null);
    const tableRef = useRef(null);
    const ctrlPressed = useRef(false);
    const shiftPressed = useRef(false);
    
    const [currentDocs, setCurrentDocs] = useState([]);
    const [selectedList, setSelectedList] = useState('all');

    
    const COLUMN_WIDTHS_STORAGE_KEY = 'columnWidths';

    const loadColumnWidths = (defaultColumns) => {
        try {
            const saved = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY);
            if (saved) {
            const parsed = JSON.parse(saved);
            // Возвращаем только ширины для колонок, которые сейчас активны
            const filtered = {};
            defaultColumns.forEach(key => {
                filtered[key] = parsed[key] || 150;
            });
            return filtered;
            }
        } catch (e) {
            console.warn('Ошибка загрузки ширин колонок из localStorage', e);
        }
        // Если нет сохранённых данных — дефолтные ширины
        const defaultWidths = {};
        defaultColumns.forEach(key => {
            defaultWidths[key] = 150;
        });
        return defaultWidths;
    };
    const [columnWidths, setColumnWidths] = useState(() => loadColumnWidths(settings.columsTable || defaultSettings.columsTable));
    // const [columnWidths, setColumnWidths] = useState(() => {
    //     // Инициализируем ширины для выбранных колонок
    //     const widths = {};
    //     (settings.columsTable || defaultSettings.columsTable).forEach(key => {
    //         widths[key] = 150; // стартовая ширина 150px
    //     });
    //     return widths;
    // });
    const totalTableWidth = selectedColumns.reduce((sum, key) => sum + (columnWidths[key] || 150), 0) + 40;
    // При изменении selectedColumns добавляем ширины для новых колонок
    // useEffect(() => {
    //     setColumnWidths(prevWidths => {
    //         const newWidths = { ...prevWidths };
    //         selectedColumns.forEach(key => {
    //         if (!newWidths[key]) {
    //             newWidths[key] = 150;
    //         }
    //         });
    //         // Можно удалить ширины для колонок, которых нет в selectedColumns, если нужно
    //         return newWidths;
    //     });
    // }, [selectedColumns]);
    useEffect(() => {
        setColumnWidths(prevWidths => {
            const newWidths = {};
            selectedColumns.forEach(key => {
            newWidths[key] = prevWidths[key] || 150;
            });
            return newWidths;
        });
    }, [selectedColumns]);
    // Для отслеживания изменения ширины
    const resizingCol = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const onMouseDownResize = (e, key) => {
        e.preventDefault();
        resizingCol.current = key;
        startX.current = e.clientX;
        startWidth.current = columnWidths[key] || 150;
        document.addEventListener('mousemove', onMouseMoveResize);
        document.addEventListener('mouseup', onMouseUpResize);
    };
    const onMouseMoveResize = (e) => {
        if (!resizingCol.current) return;
        const deltaX = e.clientX - startX.current;
        const newWidth = Math.max(50, startWidth.current + deltaX);
        setColumnWidths(prev => {
            const updated = { ...prev, [resizingCol.current]: newWidth };
            try {
                localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.warn('Ошибка сохранения ширин колонок в localStorage', e);
            }
            return updated;
        });
    };
    const onMouseUpResize = () => {
        resizingCol.current = null;
        document.removeEventListener('mousemove', onMouseMoveResize);
        document.removeEventListener('mouseup', onMouseUpResize);
    };
    const onTouchStartResize = (e, key) => {
        e.preventDefault();
        resizingCol.current = key;
        startX.current = e.touches[0].clientX;
        startWidth.current = columnWidths[key] || 150;
        document.addEventListener('touchmove', onTouchMoveResize, { passive: false });
        document.addEventListener('touchend', onTouchEndResize);
    };
    const onTouchMoveResize = (e) => {
        if (!resizingCol.current) return;
        e.preventDefault(); // предотвращаем скролл страницы при перетаскивании
        const deltaX = e.touches[0].clientX - startX.current;
        const newWidth = Math.max(50, startWidth.current + deltaX);
        setColumnWidths(prev => {
            const updated = { ...prev, [resizingCol.current]: newWidth };
            try {
                localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.warn('Ошибка сохранения ширин колонок в localStorage', e);
            }
            return updated;
        });
    };
    const onTouchEndResize = () => {
        resizingCol.current = null;
        document.removeEventListener('touchmove', onTouchMoveResize);
        document.removeEventListener('touchend', onTouchEndResize);
    };
    
    
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

    // поиск по таблице
    const handleSelectListHeader = (e) => {
        setSelectedList(e.target.value);
    };
    const handleSearchClick = () => {
        setIsSearchActive(true);
        inputRef.current.focus();
    };

    useEffect(() => {
        const selectedLists = JSON.parse(localStorage.getItem('selectedLists')) || [];
        const lowerSearch = searchTerm.toLowerCase().trim();
        // Фильтрация по поиску
        const filteredBySearch = !lowerSearch
            ? allRows
            : allRows.filter(row =>
                (row.code && row.code.toLowerCase().includes(lowerSearch)) ||
                (row.nameTop && row.nameTop.toLowerCase().includes(lowerSearch)) ||
                (row.nameBottom && row.nameBottom.toLowerCase().includes(lowerSearch)) ||
                (row.version_ext && row.version_ext.toLowerCase().includes(lowerSearch)) ||
                String(row.id).includes(lowerSearch) ||
                (row.createdBy && row.createdBy.toLowerCase().includes(lowerSearch)) ||
                (row.editedBy && row.editedBy.toLowerCase().includes(lowerSearch))
            );
        // Фильтрация по выбранному списку
        const filtered = selectedList === 'all'
            ? filteredBySearch
            : filteredBySearch.filter(row =>
                selectedLists.some(entry => entry[0] === row.id && entry[1] === selectedList)
            );
        setFilteredRows(filtered);
    }, [searchTerm, allRows, selectedList]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsSearchActive(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const [selectedRows, setSelectedRows] = useState([]);
    const handleDocumentClick = (e) => {
        // Проверяем, был ли клик внутри кнопки поиска
        if (!e.target.closest('.btn-search')) {
            setIsSearchActive(false);
        }
        // if (tableRef.current && !tableRef.current.contains(e.target)) {
        //     setSelectedRows([]);
        //     setSelectedRowId(null);
        // }
        // localStorage.setItem('selectRow', JSON.stringify(''));
        if (
            tableRef.current?.contains(e.target) ||
            e.target.closest('#btn-settings') ||
            e.target.closest('#btn-settings-mobile') ||
            e.target.closest('.sidebar') ||
            e.target.closest('.modal-info-row') ||
            e.target.closest('.main_content-panel')
        ) {
            return;
        }
        // Иначе очищаем
        setSelectedRows([]);
        setSelectedRowId(null);
        localStorage.setItem('selectRow', JSON.stringify(''));
    };

    // РАБОТА СО СПИСКАМИ
    const [newListName, setNewListName] = useState('');
    const [isModalOpenAdd, setIsModalOpenAdd] = useState(false);
    const inputListAddRef = useRef();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editInputValue, setEditInputValue] = useState('');
    const [newListEditName, setNewListEditName] = useState('');
    const [filteredEditLists, setFilteredEditLists] = useState([]);
    const inputEditRef = useRef();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteInputValue, setDeleteInputValue] = useState('');
    const [filteredDeleteLists, setFilteredDeleteLists] = useState([]);
    const inputDeleteRef = useRef();

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
            name: newListName,
        };
        const updatedLists = [...lists, newList];
        setLists(updatedLists);
        localStorage.setItem('documentLists', JSON.stringify(updatedLists)); // Сохранение в localStorage
        setNewListName(''); // Очистка поля ввода
        setIsModalOpenAdd(false); // Закрытие модального окна
    };
    const handleCancel = (e) => {
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

    // ESC закрытие модалок
    const closeAllModals = () => {
        if (isModalOpenAdd) setIsModalOpenAdd(false);
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        // если есть другие модалки — закрывайте их тоже
    };
    useEffect(() => {
  const handleEsc = (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      // Приводим к булеву, если в localStorage хранится строка
      const escCloseBool = settings.escClose === true || settings.escClose === 'true';
      console.log('Escape pressed, escClose:', escCloseBool);
      if (!escCloseBool) {
        // Если escClose false — не закрываем модалки
        return;
      }
      if (isModalOpenAdd || isEditModalOpen || isDeleteModalOpen) {
        closeAllModals();
      }
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => {
    window.removeEventListener('keydown', handleEsc);
  };
}, [settings.escClose, isModalOpenAdd, isEditModalOpen, isDeleteModalOpen]);
    
    // РАБОТА СО СТРОКАМ
    const [selectedRowId, setSelectedRowId] = useState(null); 
    const [lastSelectedRowId, setLastSelectedRowId] = useState(null);
    const [selectedRowColor, setSelectedRowColor] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [isSorted, setIsSorted] = useState(false);
    const [originalRows, setOriginalRows] = useState([]);
    const [filteredRowsBeforeSort, setFilteredRowsBeforeSort] = useState(null);
    const [isSortedByFavorites, setIsSortedByFavorites] = useState(false);
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        // Загружаем выбранный id из localStorage при монтировании компонента
        const savedSelectedRowId = JSON.parse(localStorage.getItem('selectRow'));
        if (savedSelectedRowId) {
            setSelectedRowId(savedSelectedRowId);
            setSelectedRows([savedSelectedRowId]); // Если вы используете массив для выделенных строк
        }
    }, []);

    const [historyList, setHistoryList] = useState(() => {
        const saved = localStorage.getItem('historyList');
        return saved ? JSON.parse(saved) : [];
    });
    const addToHistoryList = (row) => {
        setHistoryList(prev => {
            const filtered = prev.filter(item => item.id !== row.id);
            const updated = [...filtered, { id: row.id, id_type: row.id_type }];
            if (updated.length > 20) updated.shift(); // максимум 20
            localStorage.setItem('historyList', JSON.stringify(updated));
            return updated;
        });
    };

    const [currentVersions, setCurrentVersions] = useState([]);

    const handleRowSelect = async (id, e) => {
        e.stopPropagation();
        setSelectedRowId(id);

        localStorage.setItem('selectRow', JSON.stringify(id));

        const selectedRow = filteredRows.find(row => row.id === id);
        setCurrentRow(selectedRow);

        if (selectedRow) {
        // Все документы с таким же id_common из allRows
        const relatedDocs = allRows.filter(row => row.id_common === selectedRow.id_common);
        // Получаем версии из API для каждого документа
        const versionsArrays = await Promise.all(
            relatedDocs.map(doc => getDocumentVersions(token, doc.id))
        );
        // Объединяем версии из API в один массив
        const apiVersions = versionsArrays.flat();
        // Объединяем документы из allRows и версии из API
        // Чтобы не было дубликатов, создаём Map по id
        const combinedMap = new Map();
        // Добавляем документы из allRows (текущие версии)
        relatedDocs.forEach(doc => {
            combinedMap.set(doc.id, {
                id: doc.id,
                version: doc.version,
                version_ext: doc.version_ext || '-',
                sentdate: doc.sentdate || null,
                code: doc.code,
                nametop: doc.nameTop,
                name: doc.nameBottom,
            });
        });
        // Добавляем версии из API (перезапишут, если совпадут id)
        apiVersions.forEach(ver => {
            combinedMap.set(ver.id, {
                id: ver.id,
                version: ver.version,
                version_ext: ver.version_ext || '-',
                sentdate: ver.sentdate || null,
                code: ver.code,
                nametop: ver.nametop,
                name: ver.name,
            });
        });
        // Преобразуем Map обратно в массив
        const combinedVersions = Array.from(combinedMap.values());
        setCurrentVersions(combinedVersions);
    } else {
        setCurrentVersions([]);
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
    useEffect(() => {
        if (!filteredRows.length) return; // Ждём, пока данные загрузятся
        const savedSelectedRowId = JSON.parse(localStorage.getItem('selectRow'));
        if (!savedSelectedRowId) return;
        // Ищем строку с нужным id в DOM
        const tableBody = tableRef.current?.querySelector('tbody');
        if (!tableBody) return;
        // Предполагаем, что у tr есть key = row.id, но в DOM key не доступен,
        // поэтому можно добавить data-атрибут data-row-id в tr
        const rowElement = tableBody.querySelector(`tr[data-row-id="${savedSelectedRowId}"]`);
        if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [filteredRows]);

    // избранное
    useEffect(() => {
        const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(storedFavorites);
    }, []);
    useEffect(() => {
        setOriginalRows(filteredRows);
    }, [filteredRows]);
    
    // const toggleFavorites = () => {
    //     if (selectedRows.length === 0) {
    //         setError('Выберите минимум одну строку');
    //         setShowError(true);
    //         setTimeout(() => {
    //             setShowError(false);
    //             setError('');
    //         }, 3000);
    //         return;
    //     }
    //     // favorites теперь массив объектов { projectId, id_type, id_common }
    //     const updatedFavorites = [...favorites];
    //     selectedRows.forEach(selectedId => {
    //         // Находим строку в filteredRows по id
    //         const row = filteredRows.find(r => r.id === selectedId);
    //         if (!row) return; // если не нашли, пропускаем
    //         // Создаём объект ключа с id_common вместо id
    //         const favKey = {
    //             projectId: projectId,
    //             id_type: row.id_type,
    //             id: row.id_common  // заменили на id_common
    //         };
    //         // Проверяем, есть ли такой объект в favorites (по всем трём полям)
    //         const index = updatedFavorites.findIndex(fav =>
    //             fav.projectId === favKey.projectId &&
    //             fav.id_type === favKey.id_type &&
    //             fav.id === favKey.id
    //         );
    //         if (index !== -1) {
    //             // Если есть — удаляем
    //             updatedFavorites.splice(index, 1);
    //         } else {
    //             // Если нет — добавляем
    //             updatedFavorites.push(favKey);
    //         }
    //     });
    //     setFavorites(updatedFavorites);
    //     localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    //     setSelectedRows([]); // Сброс выделения после действия
    // };
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
    selectedRows.forEach(selectedId => {
        const row = filteredRows.find(r => r.id === selectedId);
        if (!row) return;
        const favKey = {
            projectId: projectId,
            id_type: row.id_type,
            id: row.id_common  // используем id_common
        };
        const index = updatedFavorites.findIndex(fav =>
            fav.projectId === favKey.projectId &&
            fav.id_type === favKey.id_type &&
            fav.id === favKey.id
        );
        if (index !== -1) {
            updatedFavorites.splice(index, 1);
        } else {
            updatedFavorites.push(favKey);
        }
    });
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setSelectedRows([]);
};



    const handleSortFavorites = () => {
        if (isSortedByFavorites) {
            if (filteredRowsBeforeSort) {
            setFilteredRows(filteredRowsBeforeSort);
            }
            setFilteredRowsBeforeSort(null);
        } else {
            setFilteredRowsBeforeSort(filteredRows);
            const sortedRows = [...filteredRows].sort((a, b) => {
            const aIsFavorite = favorites.some(fav =>
                fav.projectId === projectId &&
                fav.id_type === a.id_type &&
                fav.id === a.id
            );
            const bIsFavorite = favorites.some(fav =>
                fav.projectId === projectId &&
                fav.id_type === b.id_type &&
                fav.id === b.id
            );
            if (aIsFavorite === bIsFavorite) return 0;
            return aIsFavorite ? -1 : 1;
            });
            setFilteredRows(sortedRows);
        }
        setIsSortedByFavorites(!isSortedByFavorites);
    };
    const [hoveredRowId, setHoveredRowId] = useState(null);
    // const toggleFavoriteSingle = (id) => {
    //     const row = filteredRows.find(r => r.id === id);
    //     if (!row) return;
    //     const favKey = {
    //         projectId: projectId,
    //         id_type: row.id_type,
    //         id: row.id_common  // заменили на id_common
    //     };
    //     const updatedFavorites = [...favorites];
    //     const index = updatedFavorites.findIndex(fav =>
    //         fav.projectId === favKey.projectId &&
    //         fav.id_type === favKey.id_type &&
    //         fav.id === favKey.id
    //     );
    //     if (index !== -1) {
    //         updatedFavorites.splice(index, 1);
    //     } else {
    //         updatedFavorites.push(favKey);
    //     }
    //     setFavorites(updatedFavorites);
    //     localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    // };
    const toggleFavoriteSingle = (id) => {
    const row = filteredRows.find(r => r.id === id);
    if (!row) return;
    const favKey = {
        projectId: projectId,
        id_type: row.id_type,
        id: row.id_common  // используем id_common
    };
    const updatedFavorites = [...favorites];
    const index = updatedFavorites.findIndex(fav =>
        fav.projectId === favKey.projectId &&
        fav.id_type === favKey.id_type &&
        fav.id === favKey.id
    );
    if (index !== -1) {
        updatedFavorites.splice(index, 1);
    } else {
        updatedFavorites.push(favKey);
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
};

   

    // контекстное меню
    const [isOneBlockVisible, setIsOneBlockVisible] = useState(false);
    const [isTwoBlockVisible, setIsTwoBlockVisible] = useState(false);
    const [isThreeBlockVisible, setIsThreeBlockVisible] = useState(false);
    const [activeList, setActiveList] = useState(null); // 'all' или 'delete'
    
    const [isModalOpenAddRow, setIsModalOpenAddRow] = useState(false);
    const contextMenuRef = useRef(null);

    const [newListNameRow, setNewListNameRow] = useState('');
    const [errorRow, setErrorRow] = useState(null);
    const [showErrorRow, setShowErrorRow] = useState(false);

    const [currentRow, setCurrentRow] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

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



    // панель информации
    const [panelIsActive, setPanelIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState('one');
    const handlePanel = () => {
        setPanelIsActive(prev => !prev); // Переключаем состояние панели
    };
    const handleTabClick = (tab) => {
        setActiveTab(tab); // Устанавливаем активный таб
        setPanelIsActive(true); // Убедитесь, что панель активна
    };

    const [favoritesLists, setFavoritesLists] = useState(() => {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    });

    const [sidebarNode, setSidebarMode] = useState('main');
    const [isHistoryActive, setIsHistoryActive] = useState(false);
    const handleHistoryButtonClick = () => {
        setIsHistoryActive(prev => !prev);
        // setSidebarMode(prev => (prev === 'history' ? 'main' : 'history'));
    };
    const handleChangeFavorites = () => {
        setSidebarMode(prev => (prev === 'favorites' ? 'main' : 'favorites'));
    };
    // useEffect(() => {
    //     if (isHistoryActive) {
    //         // Фильтруем и сортируем filteredRows по истории
    //         const savedHistory = JSON.parse(localStorage.getItem('historyList')) || [];
    //         if (savedHistory.length === 0) return; // если истории нет, ничего не делаем
    //         // Фильтруем по выбранной ветке (selectedFilterIds)
    //         let filteredByBranch = [];
    //         if (selectedFilterIds.length === 0) {
    //             filteredByBranch = allRows;
    //         } else {
    //             filteredByBranch = allRows.filter(row => selectedFilterIds.includes(row.id_type));
    //         }
    //         // Сортируем filteredByBranch так, чтобы последние просмотренные были сверху
    //         const historyIds = savedHistory.map(item => item.id).reverse();

    //         const sorted = [...filteredByBranch].sort((a, b) => {
    //             const aIndex = historyIds.indexOf(a.id);
    //             const bIndex = historyIds.indexOf(b.id);
    //             if (aIndex === -1 && bIndex === -1) return 0;
    //             if (aIndex === -1) return 1;
    //             if (bIndex === -1) return -1;
    //             return aIndex - bIndex;
    //         });
    //         setFilteredRows(sorted);
    // } else {
    //         // При выключении истории возвращаем фильтр по ветке без сортировки по истории
    //         if (selectedFilterIds.length === 0) {
    //             setFilteredRows(allRows);
    //         } else {
    //             setFilteredRows(allRows.filter(row => selectedFilterIds.includes(row.id_type)));
    //         }
    //     }
    // }, [isHistoryActive, selectedFilterIds, allRows]);
    useEffect(() => {
    if (isHistoryActive) {
        const savedHistory = JSON.parse(localStorage.getItem('historyList')) || [];
        if (savedHistory.length === 0) {
            setFilteredRows([]); // если истории нет, показываем пустой список
            return;
        }

        // Получаем id из истории в обратном порядке (последние сверху)
        const historyIdsReversed = savedHistory.map(item => item.id).reverse();

        // Фильтруем allRows по выбранной ветке (selectedFilterIds), если есть фильтр
        let filteredByBranch = [];
        if (selectedFilterIds.length === 0) {
            filteredByBranch = allRows;
        } else {
            filteredByBranch = allRows.filter(row => selectedFilterIds.includes(row.id_type));
        }

        // Оставляем только те строки, id которых есть в истории
        const filteredByHistory = filteredByBranch.filter(row => historyIdsReversed.includes(row.id));

        // Сортируем по порядку в истории (последние сверху)
        const sorted = filteredByHistory.sort((a, b) => {
            return historyIdsReversed.indexOf(a.id) - historyIdsReversed.indexOf(b.id);
        });

        setFilteredRows(sorted);
    } else {
        // При выключении истории возвращаем фильтр по ветке без сортировки по истории
        if (selectedFilterIds.length === 0) {
            setFilteredRows(allRows);
        } else {
            setFilteredRows(allRows.filter(row => selectedFilterIds.includes(row.id_type)));
        }
    }
}, [isHistoryActive, selectedFilterIds, allRows]);


    const rowsToDisplay = sidebarNode === 'favorites'
    ? filteredRows.filter(row =>
        favorites.some(fav =>
            fav.projectId === projectId &&
            fav.id_type === row.id_type &&
            fav.id === row.id_common
        )
        )
    : filteredRows;

    const handleFilterByFavoriteIdType = (idType) => {
        setFilterSource('favorites'); // или другой флаг, если нужно
        setSelectedFilterIds([idType]);
    };


    const videoLogoRef = useRef(null);
    useEffect(() => {
        if (videoLogoRef.current) {
            videoLogoRef.current.playbackRate = 3.0;
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

                <Link to={`/settings?prevPage=all_documents/${encodeURIComponent(projectId)}/${encodeURIComponent(projectName)}`} state={projectName} id="btn-settings-mobile">
                    <img src={require('../../assets/icons/settings.png')} alt="Выйти" />
                </Link>

                <Link to='/home' id="button-back" onClick={buttonBack}>
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

                <div className="sidebar-panel">
                    <div className="sidebar-panel-item">
                        <button
                            className={`sidebar-panel-item-btn history ${isHistoryActive ? 'active' : ''}`}
                            onClick={handleHistoryButtonClick}
                        >
                            <img className="his1" src={require('../../assets/icons/history.png')} alt="" />
                            <img className="his2" src={require('../../assets/icons/history_view.png')} alt="" />
                        </button>
                        <button
                            className={`sidebar-panel-item-btn favorites ${sidebarNode === 'favorites' ? 'active' : ''}`}
                            onClick={handleChangeFavorites}
                        >
                            <img className="fav1" src={require('../../assets/icons/star.png')} alt="" />
                            <img className="fav2" src={require('../../assets/icons/star_fav.png')} alt="" />
                        </button>
                    </div>
                </div>
    
                {sidebarNode === 'main' && (
                    <div className="sidebar-menu">
                        <ul>
                            <ProjectTree projectId={projectId} onProjectSelect={handleProjectSelect} />
                        </ul>
                    </div>
                )}
                {sidebarNode === 'favorites' && (
                    <div className="sidebar-menu-favorites">
                        {favorites.length === 0 && (
                            <div className="sidebar-menu-favorites-item none"><span style={{opacity: '.5'}}>Избранные отсутствуют</span></div>
                        )}
                        {favorites.length > 0 && (
                            <FavoritesTree favorites={favorites} onFilterByIdType={handleFilterByFavoriteIdType} />
                        )}
                    </div>
                )}
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
                                    className='list-btn'
                                    // className={`list-btn ${hintsActive.add ? 'active' : ''}`} 
                                    id="btn-list-add"
                                    // onMouseEnter={() => changeActiveHint('add')}
                                    // onMouseLeave={() => changeNoActiveHint('add')}
                                    onClick={() => setIsModalOpenAdd(true)}
                                >
                                    <img src={require('../../assets/icons/plus.png')} alt="" />
                                    {/* {hintsActive.add && <div className="list-btn-hint">Создать список</div>} */}
                                </button>
                                <button
                                    className='list-btn'
                                    // className={`list-btn ${hintsActive.edit ? 'active' : ''}`} 
                                    id="btn-list-edit"
                                    // onMouseEnter={() => changeActiveHint('edit')}
                                    // onMouseLeave={() => changeNoActiveHint('edit')}
                                    onClick={handleEditModalOpen}
                                >
                                    <img src={require('../../assets/icons/edit.png')} alt="" />
                                    {/* {hintsActive.edit && <div className="list-btn-hint">Редактировать список</div>} */}
                                </button>
                                <button
                                    className='list-btn'
                                    // className={`list-btn ${hintsActive.delete ? 'active' : ''}`} 
                                    id="btn-list-delete"
                                    // onMouseEnter={() => changeActiveHint('delete')}
                                    // onMouseLeave={() => changeNoActiveHint('delete')}
                                    onClick={handleDeleteModalOpen}
                                >
                                    <img src={require('../../assets/icons/delete.png')} alt="" />
                                    {/* {hintsActive.delete && <div className="list-btn-hint">Удалить список</div>} */}
                                </button>
                            </div>
                        </div>

                        <div className="main-btns">
                            <button 
                                id="btn-search"
                                className={`btn-search ${isSearchActive ? 'active' : ''}`}
                                onClick={handleSearchClick}
                            >
                                <img src={require('../../assets/icons/search.png')} alt="" />
                                <input 
                                    type="text"
                                    id="input-search"
                                    className="styled-text"
                                    placeholder={lang === 'ru' ? "Найти..." : "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    ref={inputRef}
                                    onBlur={() => setIsSearchActive(false)} // опционально, чтобы скрывать активность при потере фокуса
                                />
                            </button>

                            <button id="btn-favorite" onClick={toggleFavorites}>
                                <img className="btn-favorite-star-nofav active" src={require('../../assets/icons/star.png')} alt="" />
                                <img className="btn-favorite-star-fav" src={require('../../assets/icons/star_fav.png')} alt="" />
                            </button>

                            <div onClick={linkSettings} state={projectName} id="btn-settings">
                                <img src={require('../../assets/icons/settings.png')} alt="" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`modal-info-row ${isOneBlockVisible ? 'active' : ''}`} ref={contextMenuRef}>
                    {/* Основной блок - всегда видим */}
                    <div className="modal-info-row-card one">
                        <div className="modal-info-row-card-item" onClick={handleViewClick}>{lang === 'ru' ? 'Посмотреть' : 'View'}</div>
                        <div className="modal-info-row-card-item" onClick={handleDownloadClick}>{lang === 'ru' ? 'Скачать' : 'Download'}</div>
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

                <div className="main_content-table noblur">

                    <table className='main-table' ref={tableRef} style={{ width: totalTableWidth }}>
                        <thead>
                            <tr>
                            <th className="col-star" onClick={handleSortFavorites} style={{ width: 40 }}>
                                <img className="fav-star-in-table thead" src={require('../../assets/icons/star_fav.png')} alt="" />
                            </th>
                            {selectedColumns.map(key => (
                                <th
                                    key={key}
                                    className={['id', 'version_ext', 'created', 'edited'].includes(key) ? 'cell-row-small styled-text' : 'styled-text'}
                                    style={{ width: columnWidths[key] }}
                                >
                                    <div style={{ position: 'relative', userSelect: 'none' }}>
                                        {columnLabels[key]}
                                        {/* Ручка для изменения ширины */}
                                        <div
                                            onMouseDown={(e) => onMouseDownResize(e, key)}
                                            onTouchStart={(e) => onTouchStartResize(e, key)}
                                            style={{
                                                position: 'absolute',
                                                right: '-13px',
                                                top: 0,
                                                height: '100%',
                                                width: 15,
                                                cursor: 'col-resize',
                                                userSelect: 'none',
                                                zIndex: 10,
                                            }}
                                        />
                                    </div>
                                </th>
                            ))}
                            </tr>
                        </thead>
                        <tbody id="table-body">
                            {rowsToDisplay.map((row, index) => {
                                const isFavorite = favorites.some(fav =>
                                    fav.projectId === projectId &&
                                    fav.id_type === row.id_type &&
                                    fav.id === row.id_common
                                );

                                return (
                                    <tr
                                        key={row.id}
                                        onDoubleClick={() => handleRowDoubleClick(row)}
                                        className={`
                                            table-body-row
                                            ${settings.bgRow === 'true' && index % 2 === 1 ? 'bg_row' : ''}
                                            ${selectedRows.includes(row.id) || selectedRowId === row.id ? 'selected' : ''}
                                        `}
                                        onClick={(e) => handleRowSelect(row.id, e)}
                                        data-row-id={row.id}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            handleActiveModalRow(e, row.id);
                                        }}
                                        style={{ backgroundColor: getRowColor(row.id) }}
                                    >
                                        <td
                                            className="col-star"
                                            onMouseEnter={() => setHoveredRowId(row.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavoriteSingle(row.id);
                                            }}
                                            style={{ cursor: 'pointer', position: 'relative', width: 40 }}
                                        >
                                            {isFavorite ? (
                                                <img src={require('../../assets/icons/star_fav.png')} alt="Избранное" />
                                            ) : (
                                                hoveredRowId === row.id && (
                                                <img
                                                    src={require('../../assets/icons/star_fav.png')}
                                                    alt="Добавить в избранное"
                                                    style={{ opacity: 0.5 }}
                                                />
                                                )
                                            )}
                                        </td>
                                        {selectedColumns.map(key => (
                                            <td
                                                key={key}
                                                className={['id', 'version_ext', 'created', 'edited'].includes(key) ? 'styled-text' : 'styled-text'}
                                                style={{ width: columnWidths[key], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {/* {key === 'version_ext' && console.log(`Rendering version_ext for row ${row.id}: "${row.version_ext}"`)} */}
                                                {columnRenderers[key] ? columnRenderers[key](row) : null}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className={`main_content-panel visible-panel ${panelIsActive ? 'active' : '' }`}>
                    <div className="main_content-panel-header">
                        <div className="main_content-panel-header-item">
                            <span
                                className={`main_content-panel-header-item-title two ${panelIsActive && activeTab === 'two' ? 'active' : ''}`} 
                                onClick={() => handleTabClick('two')}
                            >
                                {lang === 'ru' ? 'Версии' : 'Versions'}
                            </span>
                            <span
                                className={`main_content-panel-header-item-title one ${panelIsActive && activeTab === 'one' ? 'active' : ''}`} 
                                onClick={() => handleTabClick('one')}
                            >
                                {lang === 'ru' ? 'История изменений' : 'History of changes'}
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

                    <div className={`main_content-panel-content ${activeTab === 'two' ? 'history' : ''} ${activeTab === 'three' ? 'note' : ''}`}>
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
                                    {currentVersions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='main-panel-row styled-text' style={{textAlign: 'center'}}>
                                                {lang === 'ru' ? 'Нет версий' : 'No versions'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentVersions.map(version => (
                                            <tr key={version.id}>
                                                <td className='main-panel-row styled-text'>{version.id}</td>
                                                <td className='main-panel-row styled-text'>{version.version}</td>
                                                <td className='main-panel-row styled-text'>{version.version_ext || '-'}</td>
                                                <td className='main-panel-row styled-text'>{version.sentdate ? formatDate(version.sentdate) : '-'}</td>
                                                <td className='main-panel-row styled-text'>{version.code}</td>
                                                <td className='main-panel-row styled-text'>{version.nametop}</td>
                                                <td className='main-panel-row styled-text'>{version.name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                    <tr>
                                        <td className="main-panel-row styled-subtext">3</td>
                                        <td className="main-panel-row styled-subtext">date</td>
                                        <td className="main-panel-row styled-subtext">text</td>
                                        <td className="main-panel-row styled-subtext">text</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={`main_content-panel-content-item three ${activeTab === 'three' ? 'active' : ''}`}>
                            {/* <span className="styled-text">Нет примечания</span> */}
                            <span className="styled-text">
                                {/* {comments} */}
                                {currentRow && currentRow.comments && currentRow.comments.trim() !== ''
                                    ? currentRow.comments
                                    : (lang === 'ru' ? 'Нет примечания' : 'No note')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AllDocuments;