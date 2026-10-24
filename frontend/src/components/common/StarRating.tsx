import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, totalReviews, size = 16 }) => {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
      {totalReviews !== undefined && (
        <span className="text-xs text-slate-500 font-medium">({totalReviews})</span>
      )}
    </div>
  );
};
