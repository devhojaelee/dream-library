import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const DOWNLOADS_FILE = path.join(process.cwd(), 'data', 'downloads.json');

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

interface UserDownload {
  userId: string;
  bookId: number;
  downloadedAt: string;
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
export const createUser = async (username: string, password: string): Promise<User> => {
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('Username already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: Date.now().toString(),
    username,
    passwordHash,
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

// Track download
export const trackDownload = (userId: string, bookId: number) => {
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
