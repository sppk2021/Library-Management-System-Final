/**
 * API CLIENT LAYER: Unified Fetch Wrapper
 * WHAT: Provides strongly-typed asynchronous functions for all frontend-to-backend communication.
 * WHY: Centralizing fetch requests ensures consistent token injection (Authorization header),
 *      unified error handling, and cleaner component logic.
 */

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('lms_jwt_token');
}

export function saveAuthToken(token: string) {
  localStorage.setItem('lms_jwt_token', token);
}

export function clearAuthStorage() {
  localStorage.removeItem('lms_jwt_token');
  localStorage.removeItem('lms_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = 'An unexpected system error occurred.';
    try {
      const data = await response.json();
      errMsg = data.error || errMsg;
    } catch {
      // Body not json
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

export const API = {
  // Auth Operations
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    saveAuthToken(data.token);
    localStorage.setItem('lms_user', JSON.stringify(data.user));
    return data;
  },

  async register(payload: any): Promise<any> {
    return request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMe(): Promise<{ user: any }> {
    return request<{ user: any }>('/auth/me');
  },

  // Users Operation
  async getUsers(): Promise<any[]> {
    return request<any[]>('/users');
  },

  async updateUserStatus(userId: number, status: 'Active' | 'Suspended'): Promise<any> {
    return request<any>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async createUser(userPayload: any): Promise<any> {
    return request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userPayload)
    });
  },

  async deleteUser(userId: number): Promise<any> {
    return request<any>(`/users/${userId}`, {
      method: 'DELETE'
    });
  },

  async updateUserRole(userId: number, roleId: number): Promise<any> {
    return request<any>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_id: roleId })
    });
  },

  async getRolePermissions(): Promise<any[]> {
    return request<any[]>('/roles/permissions');
  },

  async updateRolePermissions(roleId: number, perms: any): Promise<any> {
    return request<any>(`/roles/permissions/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(perms)
    });
  },

  // Members Operation
  async getMembers(): Promise<any[]> {
    return request<any[]>('/members');
  },

  async updateMember(memberId: number, profile: any): Promise<any> {
    return request<any>(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  },

  // Categories Operation
  async getCategories(): Promise<any[]> {
    return request<any[]>('/categories');
  },

  async createCategory(category_name: string, description: string): Promise<any> {
    return request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify({ category_name, description })
    });
  },

  async updateCategory(catId: number, category_name: string, description: string): Promise<any> {
    return request<any>(`/categories/${catId}`, {
      method: 'PUT',
      body: JSON.stringify({ category_name, description })
    });
  },

  async deleteCategory(catId: number): Promise<any> {
    return request<any>(`/categories/${catId}`, {
      method: 'DELETE'
    });
  },

  // Books Catalog Operation
  async getBooks(): Promise<any[]> {
    return request<any[]>('/books');
  },

  async createBook(book: any): Promise<any> {
    return request<any>('/books', {
      method: 'POST',
      body: JSON.stringify(book)
    });
  },

  async updateBook(bookId: number, book: any): Promise<any> {
    return request<any>(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(book)
    });
  },

  async deleteBook(bookId: number): Promise<any> {
    return request<any>(`/books/${bookId}`, {
      method: 'DELETE'
    });
  },

  // Borrow & Return Operations
  async getBorrows(): Promise<any[]> {
    return request<any[]>('/borrows');
  },

  async borrowBook(book_id: number, member_id: number, days?: number): Promise<any> {
    return request<any>('/borrows', {
      method: 'POST',
      body: JSON.stringify({ book_id, member_id, days })
    });
  },
  async requestBorrow(book_id: number): Promise<any> {
    return request<any>('/borrows/request', {
      method: 'POST',
      body: JSON.stringify({ book_id })
    });
  },
  async updateBorrowStatus(borrow_id: number, status: string): Promise<any> {
    return request<any>(`/borrows/${borrow_id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async returnBook(borrow_id: number): Promise<any> {
    return request<any>(`/borrows/${borrow_id}/return`, {
      method: 'POST'
    });
  },

  async renewBook(borrow_id: number, days?: number): Promise<any> {
    return request<any>(`/borrows/${borrow_id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  },

  // Reservations Operation
  async getReservations(): Promise<any[]> {
    return request<any[]>('/reservations');
  },

  async reserveBook(book_id: number): Promise<any> {
    return request<any>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ book_id })
    });
  },

  async updateReservationStatus(resId: number, status: string): Promise<any> {
    return request<any>(`/reservations/${resId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Fines Operation
  async getFines(): Promise<any[]> {
    return request<any[]>('/fines');
  },

  async updateFineStatus(fineId: number, status: 'Paid' | 'Waived', remarks?: string): Promise<any> {
    return request<any>(`/fines/${fineId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks })
    });
  },

  // Reporting Operations
  async getDashboardStats(): Promise<any> {
    return request<any>('/reports/stats');
  },

  // Backups Operations
  async getBackups(): Promise<any[]> {
    return request<any[]>('/backups');
  },

  async triggerBackup(): Promise<{ success: boolean; backup_file: string }> {
    return request<{ success: boolean; backup_file: string }>('/backups', {
      method: 'POST'
    });
  },

  async restoreBackup(backupFile: string): Promise<any> {
    return request<any>(`/backups/${backupFile}/restore`, {
      method: 'POST'
    });
  },

  async seedBooks(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/backups/seed-books', {
      method: 'POST'
    });
  },

  // Auditing logs
  async getActivityLogs(): Promise<any[]> {
    return request<any[]>('/logs');
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    return request<any[]>('/notifications');
  },

  async markNotificationRead(notifId: number): Promise<any> {
    return request<any>(`/notifications/${notifId}/read`, {
      method: 'POST'
    });
  }
};
