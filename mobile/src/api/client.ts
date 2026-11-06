const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    console.log('API_URL:', API_URL);

    if (!response.ok) {
        throw new Error('login failed');
    }

    return response.json();
}

async function authRequest(method: string, path: string, token: string, body?: unknown) {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) throw new Error('unauthorized');
    if (!response.ok) throw new Error('request failed');

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const getMe = (token: string) => authRequest('GET', '/me', token);
export const getTasks = (token: string) => authRequest('GET', '/tasks', token);
export const createTask = (token: string, title: string) => authRequest('POST', '/tasks', token, { title });
export const setTaskCompleted = (token: string, id: string, completed: boolean) => authRequest('PATCH', `/tasks/${id}`, token, { completed });
export const deleteTask = (token: string, id: string) => authRequest('DELETE', `/tasks/${id}`, token);