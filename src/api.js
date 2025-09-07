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
        console.error('Error response:', errorText); // Выводим текст ошибки в консоль
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
            console.error('Error response:', errorText);
            throw new Error('Ошибка при получении дерева типов');
        }

        const data = await response.json();
        return data; // Возвращаем данные дерева типов
    } catch (error) {
        console.error('Fetch error:', error);
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
        console.error('Failed to fetch documents:', error);
        throw error; // Rethrow the error for further handling
    }
};