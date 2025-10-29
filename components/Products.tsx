import React from 'react';
import { Product } from '../types';

interface ProductsProps {
  products: Product[];
  onViewDetails?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const Products: React.FC<ProductsProps> = ({ products, onViewDetails, onEdit, onDelete }) => {
  return (
    <div className="p-8">
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-secondary/30">
            <tr>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Product Name</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Type</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Price</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Description</th>
              <th className="p-4 text-sm font-semibold text-text-secondary tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-text-secondary capitalize">{product.type}</td>
                <td className="p-4 text-text-secondary">${product.price.toLocaleString()}</td>
                <td className="p-4 text-text-secondary text-sm max-w-md truncate">{product.description}</td>
                <td className="p-4 space-x-3">
                  <button
                    className="text-primary hover:underline text-sm"
                    onClick={() => onViewDetails?.(product)}
                  >
                    View
                  </button>
                  <button
                    className="text-primary hover:underline text-sm"
                    onClick={() => onEdit?.(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400 hover:text-red-200 text-sm"
                    onClick={() => onDelete?.(product)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
