import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const DOWNLOADS_FILE = path.join(process.cwd(), 'data', 'downloads.json');

// Enhanced tracking types
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'eink';
export type UIMode = 'standard' | 'eink';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  approved: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  // Enhanced engagement tracking
  lastLogin?: string;
  totalSessionDuration?: number; // in seconds
}

interface UserDownload {
  userId: string;
  bookId: number;
  downloadedAt: string;
  // Enhanced tracking fields
  deviceType?: DeviceType;
  uiMode?: UIMode;
  sessionId?: string;
  // Book metadata for analytics
  bookTitle?: string;
  bookAuthor?: string;
  genre?: string;
}

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get all users
export const getUsers = (): User[] => {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
};

// Save users
const saveUsers = (users: User[]) => {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Get user by username
export const getUserByUsername = (username: string): User | null => {
  const users = getUsers();
  return users.find(u => u.username === username) || null;
};

// Create user
export const createUser = async (username: string, password: string, email: string): Promise<User> => {
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('Username already exists');
  }

  if (users.find(u => u.email === email)) {
    throw new Error('Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = email === 'hoje0711@naver.com';

  const newUser: User = {
    id: Date.now().toString(),
    username,
    passwordHash,
    email,
    approved: isAdmin ? true : false, // 관리자는 자동 승인
    role: isAdmin ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (userId: string, rememberMe: boolean = false): string => {
  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

// Get downloads
export const getDownloads = (): UserDownload[] => {
  ensureDataDir();
  if (!fs.existsSync(DOWNLOADS_FILE)) {
    fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(DOWNLOADS_FILE, 'utf-8');
  return JSON.parse(data);
};

// Save downloads
const saveDownloads = (downloads: UserDownload[]) => {
  ensureDataDir();
  fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
};

// Generate session ID
export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

// Update last login timestamp
export const updateLastLogin = (userId: string): boolean => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return false;
  }

  user.lastLogin = new Date().toISOString();
  saveUsers(users);
  return true;
};

// Track download with enhanced parameters
export const trackDownload = (
  userId: string,
  bookId: number,
  options?: {
    deviceType?: DeviceType;
    uiMode?: UIMode;
    sessionId?: string;
    bookTitle?: string;
    bookAuthor?: string;
    genre?: string;
  }
) => {
  const downloads = getDownloads();

  // Check if already downloaded
  const existing = downloads.find(d => d.userId === userId && d.bookId === bookId);
  if (existing) {
    return; // Already tracked
  }

  downloads.push({
    userId,
    bookId,
    downloadedAt: new Date().toISOString(),
    ...options, // Spread optional tracking data
  });

  saveDownloads(downloads);
};

// Get user downloads
export const getUserDownloads = (userId: string): number[] => {
  const downloads = getDownloads();
  return downloads
    .filter(d => d.userId === userId)
    .map(d => d.bookId);
};

// Get user download history with dates
export const getUserDownloadHistory = (userId: string): { bookId: number; downloadedAt: string }[] => {
  const downloads = getDownloads();
  return downloads
    .filter(d => d.userId === userId)
    .map(d => ({ bookId: d.bookId, downloadedAt: d.downloadedAt }));
};

// Approve user
export const approveUser = (userId: string): boolean => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return false;
  }

  user.approved = true;
  // 승인 시 이메일 체크하여 admin 권한 부여
  if (user.email === 'hoje0711@naver.com') {
    user.role = 'admin';
  }
  saveUsers(users);
  return true;
};

// Reject (delete) user
export const rejectUser = (userId: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);

  if (filteredUsers.length === users.length) {
    return false; // User not found
  }

  saveUsers(filteredUsers);

  // Cascade delete: Remove user's downloads
  const downloads = getDownloads();
  const filteredDownloads = downloads.filter(d => d.userId !== userId);
  saveDownloads(filteredDownloads);

  return true;
};

// Delete user (for admin delete user function)
export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);

  if (filteredUsers.length === users.length) {
    return false; // User not found
  }

  saveUsers(filteredUsers);

  // Cascade delete: Remove user's downloads
  const downloads = getDownloads();
  const filteredDownloads = downloads.filter(d => d.userId !== userId);
  saveDownloads(filteredDownloads);

  return true;
};

// Get pending users (not approved yet)
export const getPendingUsers = (): User[] => {
  const users = getUsers();
  return users.filter(u => !u.approved);
};

// Get user by ID
export const getUserById = (userId: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
};

// Change password
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newPasswordHash;

  saveUsers(users);
  return true;
};
