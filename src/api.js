import { apiUrl, login, password } from './settings';

export const authenticate = async (username, password) => {
    try {
        const response = await fetch(`${apiUrl}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Invalid credentials'); // Выбрасываем ошибку, если авторизация не удалась
        }

        const data = await response.json();
        return data.access; // Возвращаем токен доступа
    } catch (error) {
        console.error('Authentication error:', error);
        return null; // Возвращаем null при ошибке
    }
};

export const getNameDatabase = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/system/name`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // Возвращаем данные проектов
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};
export const getNameUserHome = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // Возвращаем данные проектов
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};
export const getInfoUser = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // Возвращаем данные проектов
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

export const getProjects = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // Возвращаем данные проектов
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

export const getProjectProperties = async (token, projectId) => {
    const response = await fetch(`${apiUrl}/projects/${projectId}/properties`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Добавьте токен, если требуется
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errorText = await response.text(); // Получаем текст ошибки для отладки
        // console.error('Error response:', errorText); // Выводим текст ошибки в консоль
        throw new Error('Ошибка при получении свойств проекта');
    }
    const data = await response.json();
    return data; // Верните данные о свойствах проекта
};

export const getTypeTree = async (token, projectId) => {
    try {
        const response = await fetch(`${apiUrl}/projects/${projectId}/typetree/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            // console.error('Error response:', errorText);
            throw new Error('Ошибка при получении дерева типов');
        }

        const data = await response.json();
        return data; // Возвращаем данные дерева типов
    } catch (error) {
        // console.error('Fetch error:', error);
        return null;
    }
};
export const getDocuments = async (token, projectId) => {
    try {
        const response = await fetch(`${apiUrl}/projects/${projectId}/documents/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include token if required
            }
        });
        if (!response.ok) {
            throw new Error(`Error fetching documents: ${response.statusText}`);
        }
        const data = await response.json();
        return data; // Return the fetched documents
    } catch (error) {
        // console.error('Failed to fetch documents:', error);
        throw error; // Rethrow the error for further handling
    }
};

export const getDocumentVersions = async (token, documentId) => {
  try {
    const response = await fetch(`${apiUrl}/documents/${documentId}/versions/`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching versions: ${response.statusText}`);
    }
    const data = await response.json();
    return data; // массив версий для документа
  } catch (error) {
    // console.error('Failed to fetch document versions:', error);
    return [];
  }
};

export const getDocumentHistory = async (token, documentId) => {
  try {
    const response = await fetch(`${apiUrl}/documents/${documentId}/history/`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching history: ${response.statusText}`);
    }
    const data = await response.json();
    return data; // массив версий для документа
  } catch (error) {
    // console.error('Failed to fetch document history:', error);
    return [];
  }
};

export const getDocumentFile = async (token, documentId) => {
  if (!token) {
    throw new Error('No auth token provided');
  }
  try {
    const response = await fetch(`${apiUrl}/documents/${documentId}/file/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Нет Content-Type — для blob
      },
      redirect: 'manual',  // ← КЛЮЧЕВОЕ: Не следовать редиректам (предотвращает загрузку login-HTML)
    });

    // Логируем для диагностики
    // console.log('Download response status:', response.status);
    // console.log('Download response headers:', {
    //   location: response.headers.get('location'),
    //   contentType: response.headers.get('content-type'),
    //   contentLength: response.headers.get('content-length')
    // });

    if (!response.ok) {
      // Если редирект (3xx), бросаем ошибку с location
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        throw new Error(`Redirect detected: ${response.status} ${response.statusText}. Location: ${location || 'unknown'}. Token may be expired.`);
      }
      // Для 401/403/5xx — детальная ошибка
      let errorMsg = `Error fetching file: ${response.status} ${response.statusText}`;
      if (response.status === 401) {
        errorMsg += ' (Unauthorized — check token)';
      }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    // Проверяем, что blob не HTML (fallback для случаев, когда сервер всё же вернул HTML)
    if (blob.type === 'text/html') {
      const text = await blob.text();
      throw new Error(`Server returned HTML instead of file. Possible login redirect. Response preview: ${text.substring(0, 200)}`);
    }

    return blob;
  } catch (error) {
    // console.error('Failed to fetch document file:', error);
    // Логируем полный error для диагностики
    if (error.name !== 'TypeError') {  // Не логировать network errors
      // console.log('Full error details:', {
      //   message: error.message,
      //   name: error.name,
      //   stack: error.stack
      // });
    }
    throw error;  // Перебрасываем для обработки в компоненте
  }
};