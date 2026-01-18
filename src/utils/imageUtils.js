// Utility for image placeholders - uses data URIs instead of external URLs to prevent errors

// Base64 encoded placeholder images (1x1 transparent PNG)
const TRANSPARENT_1X1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4=';

// Create a simple colored placeholder SVG
const createPlaceholderSVG = (width = 100, height = 75, bgColor = '#f5f5f5', textColor = '#999', text = 'No Image') => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const getPlaceholderImage = (width = 100, height = 75, text = 'No Image') => {
  return createPlaceholderSVG(width, height, '#f5f5f5', '#999', text);
};

export const getProductPlaceholder = () => getPlaceholderImage(300, 400, 'Product');
export const getSearchPlaceholder = () => getPlaceholderImage(100, 75, 'No Image');
export const getOrderItemPlaceholder = () => getPlaceholderImage(80, 80, 'Product');

// Helper to get product image with fallback
export const getProductImage = (product) => {
  if (!product) return getProductPlaceholder();
  
  // Try multiple image fields
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const img = product.images[0];
    if (img && typeof img === 'string' && img.trim()) return img;
  }
  
  if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
    return product.imageUrl;
  }
  
  if (product.image && typeof product.image === 'string' && product.image.trim()) {
    return product.image;
  }
  
  // Return appropriate placeholder based on context
  return getProductPlaceholder();
};

