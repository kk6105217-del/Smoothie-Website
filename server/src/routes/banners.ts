import { Router, Response } from 'express';
import { db } from '../database.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

export const bannersRouter = Router();

// Public: Get active banners
bannersRouter.get('/', (req, res) => {
  try {
    const banners = db.prepare(`
      SELECT * FROM banners 
      WHERE is_active = 1 
      ORDER BY display_order ASC, id ASC
    `).all();

    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch banners.' });
  }
});

// Admin: Get all banners
bannersRouter.get('/admin/all', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const banners = db.prepare('SELECT * FROM banners ORDER BY display_order ASC, id ASC').all();
    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch banners.' });
  }
});

// Admin: Create Banner
bannersRouter.post('/admin', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, subtitle, image_url, link_url, button_text, display_order, is_active } = req.body;

    if (!title || !image_url) {
      res.status(400).json({ error: 'Title and image URL are required.' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO banners (title, subtitle, image_url, link_url, button_text, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      subtitle || null,
      image_url,
      link_url || '/products',
      button_text || 'Shop Now',
      display_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    res.status(201).json({ message: 'Banner created.', id: Number(result.lastInsertRowid) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create banner.' });
  }
});

// Admin: Update Banner
bannersRouter.put('/admin/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, subtitle, image_url, link_url, button_text, display_order, is_active } = req.body;

    db.prepare(`
      UPDATE banners SET
        title = ?, subtitle = ?, image_url = ?, link_url = ?, button_text = ?, display_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      title,
      subtitle,
      image_url,
      link_url,
      button_text,
      display_order,
      is_active ? 1 : 0,
      req.params.id
    );

    res.json({ message: 'Banner updated.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update banner.' });
  }
});

// Admin: Delete Banner
bannersRouter.delete('/admin/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
    res.json({ message: 'Banner deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete banner.' });
  }
});
