import React from 'react';
const ProductCard = React.memo(({ product, quantity, onUpdateQuantity }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center sm:items-start transition-shadow hover:shadow-md">
      <div className="w-24 h-24 shrink-0 bg-slate-50 rounded-lg p-2 flex items-center justify-center">
        <img 
          src={product.image} 
          alt={product.title} 
          className="max-w-full max-h-full object-contain mix-blend-multiply"
          loading="lazy"
        />
      </div>
      
      <div className="grow flex flex-col text-center sm:text-left w-full sm:w-auto">
        <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm sm:text-base">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            {product.category}
          </p>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs font-bold text-slate-700">{product.rating?.rate}</span>
            <span className="text-xs text-slate-400">({product.rating?.count})</span>
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mt-2">
          ${product.price.toFixed(2)}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 sm:mt-0 bg-slate-50 p-1 rounded-lg border border-slate-200">
        <button 
          onClick={() => onUpdateQuantity(product, (quantity || 0) - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
          disabled={!quantity || quantity<=0}
        >
          -
        </button>
        <span className="w-6 text-center font-medium text-slate-800 text-sm">
          {quantity || 0}
        </span>
        <button 
          onClick={() => onUpdateQuantity(product, (quantity || 0) + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-700 shadow-sm active:scale-95 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;