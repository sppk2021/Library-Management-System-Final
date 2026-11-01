/**
 * BACKEND ENTRY POINT: Express Server Configuration
 * WHAT: Implements the RESTful API server, Vite SPA middleware, and authentication endpoints.
 * WHY: We combine the API and static file serving into a single process for simplified deployment.
 *      Middleware is used to ensure RBAC (Role-Based Access Control) across sensitive endpoints.
 */
import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { Database, bootstrapMySQLDatabase } from './server/database';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'lms-super-secret-key-ncc-global';

app.use(express.json());

// Bootstrap database on start
bootstrapMySQLDatabase()
  .then((success) => {
    if (success) {
      console.log('[Database] MySQL tables configured successfully.');
    } else {
      console.log('[Database] Operating with local JSON Database engine.');
    }
  })
  .catch((err) => {
    console.error('[Database] Failed to initialize database bootstrap:', err);
  });

// Simple Secure Middleware for JSON Web Token Validation & Role Checking
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role_id: number;
    role: 'Admin' | 'Librarian' | 'Student';
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access Denied. Authorization token required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const requireRoles = (allowedRoles: ('Admin' | 'Librarian' | 'Student' | 'Staff')[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Role Unauthorized. Operation forbidden.' });
      return;
    }
    next();
  };
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  try {
    const account = await Database.login(username);
    if (!account) {
      res.status(401).json({ error: 'Username not found. Please register first.' });
      return;
    }

    const isMatched = bcrypt.compareSync(password, account.passwordHash);
    if (!isMatched) {
      res.status(401).json({ error: 'Invalid password. Access denied.' });
      return;
    }

    if (account.user.status === 'Suspended') {
      res.status(403).json({ error: 'Your account is suspended. Connect with administrative team.' });
      return;
    }

    const permissions = await Database.getRolePermissions();
    const userPerms = permissions.find(p => p.role_id === account.user.role_id) || {
      role_id: account.user.role_id,
      dashboard: account.user.role_id !== 3,
      books: true,
      borrowing: account.user.role_id !== 3,
      reports: account.user.role_id !== 3,
      users: account.user.role_id !== 3,
      settings: account.user.role_id === 1
    };

    // Generate Token
    const userPayload = {
      id: account.user.id,
      username: account.user.username,
      email: account.user.email,
      role_id: account.user.role_id,
      role: account.user.role,
      permissions: userPerms
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

    await Database.log(account.user.id, 'USER_LOGIN', `User ${username} logged in successfully.`);

    const userWithPerms = {
      ...account.user,
      permissions: userPerms
    };

    res.json({
      token,
      user: userWithPerms
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal login issue.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, fullName, phone, address } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Required attributes fields missing.' });
    return;
  }
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character.' });
    return;
  }

  try {
    const userRoleNumber = 3; // Hardcode to 3 (Student Role)
    const memberDetails = {
      name: fullName || username,
      phone: phone || '',
      address: address || ''
    };

    const user = await Database.register(username, email, password, userRoleNumber, memberDetails);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const permissions = await Database.getRolePermissions();
    const userPerms = permissions.find(p => p.role_id === req.user!.role_id);
    const userWithPerms = {
      ...req.user,
      permissions: userPerms
    };
    res.json({ user: userWithPerms });
  } catch (err) {
    res.json({ user: req?.user });
  }
});

// ==========================================
// USERS & MEMBERS MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/users', authenticateToken, requireRoles(['Admin']), async (req, res) => {
  try {
    const list = await Database.getUsers();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const { username, email, password, role_id, fullName, phone, address } = req.body;
  if (!username || !email || !password || !role_id) {
    res.status(400).json({ error: 'Username, email, password, and role_id are required fields.' });
    return;
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character.' });
    return;
  }

  try {
    const newUser = await Database.register(username, email, password, Number(role_id), {
      name: fullName || username,
      phone: phone || '',
      address: address || ''
    });
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete your own active administrator account!' });
    return;
  }
  try {
    const success = await Database.deleteUser(targetId, req.user!.id);
    if (success) {
      res.json({ success: true, message: 'User deleted completely.' });
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/role', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  const { role_id } = req.body;
  if (!role_id) {
    res.status(400).json({ error: 'role_id parameter is required.' });
    return;
  }
  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Cannot alter your own highest-level administrative role!' });
    return;
  }
  try {
    const success = await Database.updateUserRole(targetId, Number(role_id), req.user!.id);
    if (success) {
      res.json({ success: true, message: 'User role updated successfully.' });
    } else {
      res.status(404).json({ error: 'User target not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/roles/permissions', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req: AuthenticatedRequest, res) => {
  try {
    const items = await Database.getRolePermissions();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/roles/permissions/:role_id', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const roleId = Number(req.params.role_id);
  try {
    const success = await Database.updateRolePermissions(roleId, req.body, req.user!.id);
    if (success) {
      res.json({ success: true, message: 'Permission mapped successfully.' });
    } else {
      res.status(404).json({ error: 'Role profile not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/status', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  const { status } = req.body;
  if (!status || !['Active', 'Suspended'].includes(status)) {
    res.status(400).json({ error: 'Active or Suspended state is required.' });
    return;
  }

  try {
    const success = await Database.updateUserStatus(targetId, status, req.user!.id);
    if (success) {
      res.json({ success: true, message: `Status updated to ${status}.` });
    } else {
      res.status(404).json({ error: 'User target not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req, res) => {
  try {
    const members = await Database.getMembers();
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/members/:id', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const memberId = Number(req.params.id);
  const { full_name, email, phone, address, membership_status } = req.body;

  try {
    const success = await Database.updateMember(memberId, full_name, email, phone, address, membership_status, req.user!.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Member not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CATEGORIES ENDPOINTS
// ==========================================

app.get('/api/categories', async (req, res) => {
  try {
    const list = await Database.getCategories();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const { category_name, description } = req.body;
  if (!category_name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  try {
    const newCat = await Database.createCategory(category_name, description || '', req.user!.id);
    res.status(201).json(newCat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { category_name, description } = req.body;

  try {
    const ok = await Database.updateCategory(id, category_name, description || '', req.user!.id);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Category not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  try {
    const ok = await Database.deleteCategory(id, req.user!.id);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Category not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BOOKS CATALOG ENDPOINTS
// ==========================================

app.get('/api/books', async (req, res) => {
  try {
    const list = await Database.getBooks();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const { title, isbn, publisher, author, genre, category_id, quantity, shelf_location, cover_image, status } = req.body;

  if (!title || !isbn || !author || !quantity) {
    res.status(400).json({ error: 'Title, ISBN, Author, and Total quantity are required fields.' });
    return;
  }

  try {
    const newBook = await Database.createBook({
      title,
      isbn,
      publisher: publisher || '',
      author,
      genre: genre || '',
      category_id: Number(category_id || 0),
      quantity: Number(quantity),
      shelf_location: shelf_location || '',
      cover_image: cover_image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
      status: status || 'Available',
      created_by: req.user!.id
    }, req.user!.id);

    res.status(201).json(newBook);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/books/:id', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  try {
    const ok = await Database.updateBook(id, req.body, req.user!.id);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Book target not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  try {
    const ok = await Database.deleteBook(id, req.user!.id);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Book target not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BORROWING & ISSUING ENDPOINTS
// ==========================================

app.get('/api/borrows', authenticateToken, requireRoles(['Admin', 'Librarian', 'Student', 'Staff']), async (req: AuthenticatedRequest, res) => {
  try {
    const list = await Database.getBorrowRecords();
    if (req.user!.role === 'Student') {
      // Find member corresponding to online student user
      const members = await Database.getMembers();
      const studentMember = members.find(m => m.user_id === req.user!.id);
      if (!studentMember) {
        res.json([]);
        return;
      }
      res.json((list || []).filter(item => item.member_id === studentMember.member_id));
      return;
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrows', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req: AuthenticatedRequest, res) => {
  const { book_id, member_id, days } = req.body;
  if (!book_id || !member_id) {
    res.status(400).json({ error: 'Book ID and Member ID are required attributes.' });
    return;
  }

  try {
    const record = await Database.borrowBook(Number(book_id), Number(member_id), req.user!.id, days ? Number(days) : 14);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/borrows/request', authenticateToken, requireRoles(['Student', 'Staff']), async (req: AuthenticatedRequest, res) => {
  const { book_id } = req.body;
  if (!book_id) {
    res.status(400).json({ error: 'Book ID is required.' });
    return;
  }

  try {
    const members = await Database.getMembers();
    const studentMember = members.find(m => m.user_id === req.user!.id);
    if (!studentMember) {
      res.status(400).json({ error: 'No active library profile associated with this account.' });
      return;
    }

    // Default 14 days, pass initialStatus = 'Pending'
    const record = await Database.borrowBook(Number(book_id), studentMember.member_id, req.user!.id, 14, 'Pending');
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/borrows/:id/status', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }

  try {
    const ok = await Database.updateBorrowStatus(id, status, req.user!.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/borrows/:id/return', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req: AuthenticatedRequest, res) => {
  const borrowId = Number(req.params.id);
  try {
    const ok = await Database.returnBook(borrowId, req.user!.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/borrows/:id/renew', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req: AuthenticatedRequest, res) => {
  const borrowId = Number(req.params.id);
  const { days } = req.body;
  try {
    const ok = await Database.renewBook(borrowId, days ? Number(days) : 14, req.user!.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// RESERVATIONS ENDPOINTS
// ==========================================

app.get('/api/reservations', authenticateToken, requireRoles(['Admin', 'Librarian', 'Student']), async (req: AuthenticatedRequest, res) => {
  try {
    const list = await Database.getReservations();
    if (req.user!.role === 'Student') {
      const mList = await Database.getMembers();
      const member = mList.find(m => m.user_id === req.user!.id);
      if (!member) {
        res.json([]);
        return;
      }
      res.json(list.filter(r => r.member_id === member.member_id));
      return;
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', authenticateToken, requireRoles(['Student']), async (req: AuthenticatedRequest, res) => {
  const { book_id } = req.body;
  if (!book_id) {
    res.status(400).json({ error: 'Book ID is required.' });
    return;
  }

  try {
    // Locate member corresponding to this user
    const list = await Database.getMembers();
    const currMember = list.find(m => m.user_id === req.user!.id);
    if (!currMember) {
      res.status(400).json({ error: 'No active library profile associated with this Student account.' });
      return;
    }

    if (currMember.membership_status === 'Suspended') {
      res.status(403).json({ error: 'Library member profile is suspended. Connect with librarian.' });
      return;
    }

    const reservation = await Database.createReservation(Number(book_id), currMember.member_id);
    res.status(201).json(reservation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/reservations/:id/status', authenticateToken, requireRoles(['Admin', 'Librarian', 'Student']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Reservation target status required.' });
    return;
  }

  try {
    // Security check: Students can only CANCEL their own reservation
    if (req.user!.role === 'Student') {
      if (status !== 'Cancelled') {
        res.status(403).json({ error: 'Students are only permitted to cancel pending reservations.' });
        return;
      }
      const reserves = await Database.getReservations();
      const currentRes = reserves.find(r => r.reservation_id === id);
      const mList = await Database.getMembers();
      const member = mList.find(m => m.user_id === req.user!.id);
      if (!currentRes || !member || currentRes.member_id !== member.member_id) {
        res.status(403).json({ error: 'You can only cancel your own pending reservations.' });
        return;
      }
    }

    const ok = await Database.updateReservationStatus(id, status, req.user!.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// FINES COLLECTION ENDPOINTS
// ==========================================

app.get('/api/fines', authenticateToken, requireRoles(['Admin', 'Librarian', 'Student']), async (req: AuthenticatedRequest, res) => {
  try {
    const fines = await Database.getFines();
    if (req.user!.role === 'Student') {
      const mList = await Database.getMembers();
      const member = mList.find(m => m.user_id === req.user!.id);
      if (!member) {
        res.json([]);
        return;
      }
      res.json(fines.filter(f => f.borrow_details?.member_name === member.full_name));
      return;
    }
    res.json(fines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fines/:id', authenticateToken, requireRoles(['Admin', 'Librarian']), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { status, remarks } = req.body;
  if (!status || !['Paid', 'Waived'].includes(status)) {
    res.status(400).json({ error: 'Status must be set to Paid or Waived.' });
    return;
  }

  try {
    const ok = await Database.updateFineStatus(id, status, remarks || `Marked as ${status} by staff.`, req.user!.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CENTRAL REPORTING DASHBOARD ENDPOINTS
// ==========================================

app.get('/api/reports/stats', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req, res) => {
  try {
    const stats = await Database.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BACKUPS MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/backups', authenticateToken, requireRoles(['Admin']), async (req, res) => {
  try {
    const list = await Database.getBackups();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const filename = await Database.runBackup(req.user!.id);
    res.status(201).json({ success: true, backup_file: filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/:file/restore', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  const file = req.params.file;
  try {
    const success = await Database.runRestore(file, req.user!.id);
    if (success) {
      res.json({ success: true, message: 'Database successfully restored.' });
    } else {
      res.status(400).json({ error: 'Restoration failed. Verify backup file exists.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/seed-books', authenticateToken, requireRoles(['Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    await Database.reseedBooks(req.user!.id);
    res.json({ success: true, message: 'Database was successfully re-populated with 100 realistic sample books. All active loans and reservations were reset.' });
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================
// ACTIVITY LOGS ENDPOINTS
// ==========================================

app.get('/api/logs', authenticateToken, requireRoles(['Admin', 'Librarian', 'Staff']), async (req, res) => {
  try {
    const logs = await Database.getActivityLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LIVE ALERTS / NOTIFICATIONS ENDPOINTS
// ==========================================

app.get('/api/notifications', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await Database.getNotifications(req.user!.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const success = await Database.markNotificationAsRead(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE CLIENT DEV MIDDLEWARE & ASSET SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build delivery
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Library Management App running on http://localhost:${PORT}`);
  });
}

startServer();
