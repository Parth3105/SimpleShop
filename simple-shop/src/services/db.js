import Dexie from 'dexie';

export const db = new Dexie('SimpleShopDB');

db.version(1).stores({
  product_snapshots: 'id' 
});

export const saveProductSnapshot = async (product) => {
  await db.product_snapshots.put(product);
};

export const getProductSnapshots = async (ids) => {
  return await db.product_snapshots.where('id').anyOf(ids).toArray();
};