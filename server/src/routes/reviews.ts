import { Router, Response } from 'express';
import { db } from '../database.js';
import { authenticateToken, requireAdmin, optionalToken, AuthenticatedRequest } from '../middleware/auth.js';

export const reviewsRouter = Router();

// Recompute product rating average
function updateProductRating(productId: number) {
  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count 
    FROM reviews 
    WHERE product_id = ? AND status = 'approved'
  `).get(productId) as { avg_rating: number | null; count: number };

  if (stats && stats.count > 0) {
    db.prepare(`
      UPDATE products SET 
        rating_avg = ROUND(?, 1), 
        rating_count = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(stats.avg_rating || 5.0, stats.count, productId);
  }
}

// Get approved reviews for a product
reviewsRouter.get('/product/:productId', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT * FROM reviews 
      WHERE product_id = ? AND status = 'approved'
      ORDER BY id DESC
    `).all(req.params.productId);

    res.json({ reviews });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Submit a review
reviewsRouter.post('/', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, customer_name, rating, title, comment } = req.body;

    if (!product_id || !rating || !comment) {
      res.status(400).json({ error: 'Product ID, rating (1-5), and review text are required.' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      return;
    }

    const userId = req.user ? req.user.id : null;
    let name = customer_name ? customer_name.trim() : (req.user ? req.user.full_name : 'Customer');

    // Check if verified purchase
    let isVerified = 0;
    if (userId) {
      const purchaseCheck = db.prepare(`
        SELECT oi.id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.payment_status = 'Paid'
        LIMIT 1
      `).get(userId, product_id);
      if (purchaseCheck) isVerified = 1;
    }

    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, customer_name, rating, title, comment, is_verified_purchase, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(product_id, userId, name, Number(rating), title || null, comment.trim(), isVerified);

    updateProductRating(Number(product_id));

    res.status(201).json({
      message: 'Thank you! Your review has been submitted.',
      reviewId: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Admin: Get all reviews for moderation
reviewsRouter.get('/admin/all', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.slug as product_slug
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.id DESC
    `).all();

    res.json({ reviews });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews for moderation.' });
  }
});

// Admin: Moderate review status (approve / reject)
reviewsRouter.patch('/admin/:id/status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }

    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(req.params.id) as any;
    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
    updateProductRating(review.product_id);

    res.json({ message: `Review marked as ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update review status.' });
  }
});

// Admin: Delete review
reviewsRouter.delete('/admin/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(req.params.id) as any;
    if (review) {
      db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
      updateProductRating(review.product_id);
    }
    res.json({ message: 'Review deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});
