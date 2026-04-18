export const generateIdempotencyKey = () => {
  return crypto.randomUUID(); 
};

export const generateCartHash = (cartItems, secureDbProducts) => {
  const sortedIds = Object.keys(cartItems).sort();
  
  const payloadToHash = sortedIds.map(id => {
    const qty = cartItems[id];
    const dbProduct = secureDbProducts.find(p => p.id === Number(id) || p.id === String(id));
    
    // If the product is missing from DB, force a failed hash
    if (!dbProduct) return 'INVALID'; 
    return `${id}:${qty}@${dbProduct.price}`;
  }).join('|');

  return btoa(payloadToHash);
};