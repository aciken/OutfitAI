// App/app/data/apparelData.js

// Individual Outfit Items
export const allOutfitItems = [
  { id: 'item_hoodie1', name: 'Cozy Hoodie', category: 'Tops', source: require('../../assets/outfits/hoodie1.png'), keywords: ['hoodie', 'cozy', 'casual', 'top', 'winter', 'sweatshirt', 'loungewear', 'comfort', 'everyday', 'sporty'] },
  { id: 'item_pants1', name: 'Casual Pants', category: 'Bottoms', source: require('../../assets/outfits/pants1.png'), keywords: ['pants', 'casual', 'bottoms', 'trousers', 'everyday', 'comfort', 'loungewear'] },
  { id: 'item_shoes1', name: 'Sneakers', category: 'Shoes', source: require('../../assets/outfits/shoes1.png'), keywords: ['sneakers', 'shoes', 'casual', 'sport', 'trainers', 'everyday', 'comfort', 'sporty'] },
  { id: 'item_dress1', name: 'Summer Dress', category: 'Dresses', source: require('../../assets/outfits/dress1.png'), keywords: ['dress', 'summer', 'light', 'floral', 'casual', 'vacation', 'bohemian', 'everyday', 'party'] },
  { id: 'item_heals1', name: 'Stylish Heels', category: 'Shoes', source: require('../../assets/outfits/heals1.png'), keywords: ['heels', 'shoes', 'stylish', 'formal', 'party', 'evening', 'elegant', 'chic'] },
  { id: 'item_jeans2', name: 'Denim Jeans', category: 'Bottoms', source: require('../../assets/outfits/jeans2.png'), keywords: ['jeans', 'denim', 'bottoms', 'casual', 'pants', 'streetwear', 'everyday'] },
  { id: 'item_shirt2', name: 'Graphic Tee', category: 'Tops', source: require('../../assets/outfits/shirt2.png'), keywords: ['shirt', 'tee', 'graphic', 'casual', 'top', 'streetwear', 'everyday'] },
  { id: 'item_shoes2', name: 'High Tops', category: 'Shoes', source: require('../../assets/outfits/shoes2.png'), keywords: ['shoes', 'high tops', 'sneakers', 'casual', 'streetwear', 'sporty'] },
  { id: 'item_polo1', name: 'Classic Polo', category: 'Tops', source: require('../../assets/outfits/Polo.png'), keywords: ['polo', 'shirt', 'classic', 'smart casual', 'top', 'work', 'business casual'] },
  { id: 'item_trousers1', name: 'Tailored Trousers', category: 'Bottoms', source: require('../../assets/outfits/trousers.png'), keywords: ['trousers', 'pants', 'tailored', 'formal', 'smart casual', 'bottoms', 'work', 'business casual', 'elegant'] },
  { id: 'item_shoes3', name: 'Formal Shoes', category: 'Shoes', source: require('../../assets/outfits/Shoes3.png'), keywords: ['shoes', 'formal', 'dress shoes', 'smart', 'leather', 'work', 'business', 'elegant'] },
  { id: 'item_nikeShoes1', name: 'Nike Shoes', category: 'Shoes', source: require('../../assets/outfits/nikeShoes.png'), keywords: ['nike', 'shoes', 'sporty', 'casual', 'sneakers', 'athletic'] },
  { id: 'item_shirtLaS1', name: 'Long Sleeve Shirt', category: 'Tops', source: require('../../assets/outfits/shirtLaS.png'), keywords: ['shirt', 'long sleeve', 'top', 'casual', 'everyday'] },
  { id: 'item_shorts1', name: 'Casual Shorts', category: 'Bottoms', source: require('../../assets/outfits/shorts.png'), keywords: ['shorts', 'bottoms', 'casual', 'summer', 'sporty'] },

  // Example: { id: 'item_belt1', name: 'Leather Belt', category: 'Accessories', source: require('../../assets/outfits/belt1.png'), keywords: ['belt', 'leather', 'accessory', 'formal', 'casual'] },
];

// Predefined Outfits for Home Page
export const predefinedOutfits = [
  {
    id: 'outfit1',
    name: 'Casual Comfort',
    previewImage: require('../../assets/outfits/outfit1.png'),
    keywords: ['casual', 'comfort', 'everyday', 'hoodie', 'pants', 'sneakers', 'relaxed', 'loungewear', 'weekend', 'sporty'],
    style: ['Street Style', 'Sporty'],
    occasion: ['Casual Day', ],
    items: [
      { itemId: 'item_hoodie1', label: 'Cozy Hoodie' },
      { itemId: 'item_pants1', label: 'Casual Pants' },
      { itemId: 'item_shoes1', label: 'Sneakers' }
    ]
  },
  {
    id: 'outfit2',
    name: 'Summer Elegance',
    previewImage: require('../../assets/outfits/outfit2.png'),
    keywords: ['summer', 'elegance', 'dress', 'heels', 'party', 'formal', 'stylish', 'evening', 'event', 'chic', 'vacation', 'bohemian'],
    style: ['Classic'],
    occasion: ['Special Event', 'Evening Out'],
    items: [
      { itemId: 'item_dress1', label: 'Summer Dress' },
      { itemId: 'item_heals1', label: 'Stylish Heels' }
    ]
  },
  {
    id: 'outfit3',
    name: 'Street Vibe',
    previewImage: require('../../assets/outfits/outfit3.png'),
    keywords: ['street', 'vibe', 'casual', 'tee', 'jeans', 'sneakers', 'urban', 'graphic', 'hip', 'streetwear', 'edgy'],
    style: ['Minimalist'],
    occasion: ['Casual Day'],
    items: [
      { itemId: 'item_shirt2', label: 'Graphic Tee' },
      { itemId: 'item_jeans2', label: 'Denim Jeans' },
      { itemId: 'item_shoes2', label: 'High Tops' }
    ]
  },
  {
    id: 'outfit4',
    name: 'Smart Casual',
    previewImage: require('../../assets/outfits/outfit4.png'),
    keywords: ['smart casual', 'polo', 'trousers', 'formal shoes', 'business casual', 'work', 'office', 'professional', 'classic', 'preppy'],
    style: ['Vintage', 'Classic'],
    occasion: ['Evening Out', 'Special Event'],
    items: [
      { itemId: 'item_polo1', label: 'Classic Polo' },
      { itemId: 'item_trousers1', label: 'Tailored Trousers' },
      { itemId: 'item_shoes3', label: 'Formal Shoes' }
    ]
  },
  {
    id: 'outfit5',
    name: 'Sporty Vibe',
    previewImage: require('../../assets/outfits/outfit5.png'),
    keywords: ['sporty', 'casual', 'nike', 'shorts', 'active', 'everyday'],
    style: ['Sporty', 'Street Style'],
    occasion: ['Casual Day', 'Workout'],
    items: [
      { itemId: 'item_shirtLaS1', label: 'Long Sleeve Shirt' },
      { itemId: 'item_shorts1', label: 'Casual Shorts' },
      { itemId: 'item_nikeShoes1', label: 'Nike Shoes' }
    ]
  }
];

// Helper function to get a specific outfit item by its ID
export const getOutfitItemById = (itemId) => {
  return allOutfitItems.find(item => item.id === itemId);
};

// Helper function to get a predefined outfit by its ID, with full item details
export const getPredefinedOutfitById = (outfitId) => {
  const outfit = predefinedOutfits.find(o => o.id === outfitId);
  if (!outfit) return null;

  return {
    ...outfit,
    detailedItems: outfit.items.map(itemRef => {
      const itemDetail = getOutfitItemById(itemRef.itemId);
      return {
        ...itemDetail, // Spread all properties from allOutfitItems (id, name, category, source)
        label: itemRef.label || itemDetail.name, // Use specific label if provided, else item name
        // height: you might want to define default heights here or pass them if needed
      };
    })
  };
};

// Function to resolve items for passing to the [id].jsx page
// This will be used by the home page when navigating.
export const getOutfitDetailsForNavigation = (outfitId) => {
  const outfit = getPredefinedOutfitById(outfitId);
  if (!outfit || !outfit.detailedItems) return null;

  // The [id].jsx page expects items to have `source` and `label`.
  // `getOutfitItemById` already includes `source`.
  return outfit.detailedItems.map(item => ({
    source: item.source, // already a require() call from allOutfitItems
    label: item.label,
    // Add any other properties [id].jsx might need from the item object
    id: item.id, 
    name: item.name,
    category: item.category
  }));
};

// This function can be used by OutfitItemAdd.jsx if you want it to also use this central data.
export const getAllOutfitItemsForDisplay = () => {
    return allOutfitItems;
}; 