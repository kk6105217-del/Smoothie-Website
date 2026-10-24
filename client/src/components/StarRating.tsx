import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  count?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 16,
  showValue = false,
  interactive = false,
  onChange,
  count
}) => {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {Array.from({ length: totalStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                size={size}
                className={`${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-xs text-vk-blue hover:underline cursor-pointer ml-1">
          ({count.toLocaleString('en-IN')})
        </span>
      )}
    </div>
  );
};
