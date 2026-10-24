import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../database.js';

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'customer';
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
      return;
    }

    req.user = decodedUser as AuthUser;
    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // Server-side database verification of admin status
  const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(req.user.id) as { id: number; email: string; role: string } | undefined;

  if (!user || user.role !== 'admin' || user.email.toLowerCase() !== config.adminEmail.toLowerCase()) {
    res.status(403).json({
      error: 'Access denied. Only the authorized administrator (karthik.suroju@gmail.com) can perform this action.'
    });
    return;
  }

  next();
}

export function optionalToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decodedUser) => {
    if (!err && decodedUser) {
      req.user = decodedUser as AuthUser;
    }
    next();
  });
}
