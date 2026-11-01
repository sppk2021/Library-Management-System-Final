// Relational model types for the Centralized Library Management System

export type UserRole = 'Admin' | 'Librarian' | 'Student' | 'Staff';

export interface Role {
  role_id: number;
  role_name: UserRole;
}

export interface RolePermission {
  role_id: number;
  dashboard: boolean;
  books: boolean;
  borrowing: boolean;
  reports: boolean;
  users: boolean;
  settings: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number; // 1 = Admin, 2 = Librarian, 3 = Student
  status: 'Active' | 'Suspended';
  created_at: string;
  updated_at: string;
  role?: UserRole; // Hydrated role name
}

export interface Member {
  member_id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  membership_status: 'Active' | 'Expired' | 'Suspended';
  created_at: string;
}

export type BookStatus = 'Available' | 'Borrowed' | 'Reserved' | 'Lost' | 'Damaged';

export interface Book {
  book_id: number;
  title: string;
  isbn: string;
  publisher: string;
  author: string;
  genre: string;
  category_id: number;
  quantity: number;
  available_quantity: number;
  shelf_location: string;
  cover_image: string;
  status: BookStatus;
  publication_year?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  category_name?: string; // Hydrated category details
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string;
}

export type ReservationStatus = 'Pending' | 'Approved' | 'Cancelled' | 'Completed' | 'Expired';

export interface Reservation {
  reservation_id: number;
  reserve_date: string;
  status: ReservationStatus;
  expiry_date: string;
  book_id: number;
  member_id: number;
  created_at: string;
  book_title?: string; // Hydrated
  member_name?: string; // Hydrated
}

export type BorrowStatus = 'Pending' | 'Borrowed' | 'Returned' | 'Overdue' | 'Rejected';

export interface BorrowRecord {
  borrow_id: number;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  borrow_status: BorrowStatus;
  book_id: number;
  member_id: number;
  approved_by: number;
  created_at: string;
  book_title?: string; // Hydrated
  member_name?: string; // Hydrated
  approved_by_username?: string; // Hydrated
  fine_amount?: number; // Hydrated fine if applicable
  fine_status?: 'Pending' | 'Paid' | 'Waived'; // Hydrated fine status
}

export type FineStatus = 'Pending' | 'Paid' | 'Waived';

export interface Fine {
  fine_id: number;
  amount: number;
  status: FineStatus;
  borrow_id: number;
  payment_date: string | null;
  remarks: string | null;
  created_at: string;
  borrow_details?: {
    book_title: string;
    member_name: string;
    issue_date: string;
    due_date: string;
  };
}

export interface ActivityLog {
  log_id: number;
  user_id: number | null;
  username?: string; // Hydrated
  action: string;
  description: string;
  created_at: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Backup {
  backup_id: number;
  backup_file: string;
  created_by: number;
  created_by_username?: string; // Hydrated
  created_at: string;
}

// Summary interface for the Dashboard
export interface DashboardStats {
  totalBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  activeUsers: number;
  totalPendingFines: number;
  totalCollectedFines: number;
  popularBooks: { title: string; author: string; count: number }[];
  borrowTrends: { date: string; borrowed: number; returned: number }[];
  monthlyBorrowStats?: { month: string; count: number }[];
}
