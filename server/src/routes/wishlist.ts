import { Router, Response } from 'express';
import { db } from '../database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const wishlistRouter = Router();

// Get Wishlist Items
wishlistRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = db.prepare(`
      SELECT 
        w.id as wishlist_id,
        w.created_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.sku,
        p.regular_price,
        p.discounted_price,
        p.stock_quantity,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image_url
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.id DESC
    `).all(req.user!.id);

    res.json({ items });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
});

// Toggle Wishlist item (Add if absent, Remove if present)
wishlistRouter.post('/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      res.status(400).json({ error: 'Product ID is required.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(req.user!.id, product_id) as any;

    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE id = ?').run(existing.id);
      res.json({ inWishlist: false, message: 'Removed from wishlist.' });
    } else {
      db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user!.id, product_id);
      res.json({ inWishlist: true, message: 'Added to wishlist.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle wishlist.' });
  }
});

// Remove from Wishlist
wishlistRouter.delete('/:productId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user!.id, req.params.productId);
    res.json({ message: 'Removed from wishlist.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove from wishlist.' });
  }
});
