import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
import { api } from '../services/api';
import { Category } from '../types';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (slug) {
      api.categories.getBySlug(slug)
        .then(res => setCategory(res.category))
        .catch(() => setCategory(null));
    }
  }, [slug]);

  return (
    <ProductsPage
      fixedCategorySlug={slug}
      categoryTitle={category ? category.name : undefined}
    />
  );
};
