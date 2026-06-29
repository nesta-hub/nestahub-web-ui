/**
 * Cloudinary URL transformation utilities
 * Applies optimization parameters to Cloudinary URLs for automatic WebP serving,
 * quality optimization, and responsive sizing
 */

interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
  quality?: 'auto' | number;
}

/**
 * Transform a Cloudinary URL to apply optimization parameters
 * @param url - Original Cloudinary URL
 * @param options - Transformation options (width, height, crop, quality)
 * @returns Optimized Cloudinary URL with transformations, or original URL if not from Cloudinary
 *
 * @example
 * // Basic optimization (auto WebP, auto quality)
 * optimizeCloudinaryUrl('https://res.cloudinary.com/.../image.jpg')
 * // => 'https://res.cloudinary.com/.../f_auto,q_auto/image.jpg'
 *
 * @example
 * // Thumbnail with size constraints
 * optimizeCloudinaryUrl('https://res.cloudinary.com/.../image.jpg', {
 *   width: 100,
 *   height: 100,
 *   crop: 'fill'
 * })
 * // => 'https://res.cloudinary.com/.../w_100,h_100,c_fill,f_auto,q_auto/image.jpg'
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  options: CloudinaryTransformOptions = {}
): string {
  // Return empty string for null/undefined
  if (!url) return '';

  // Only process Cloudinary URLs
  if (!url.includes('cloudinary.com')) return url;

  // Check if URL already has transformations (to avoid double-transforming)
  if (url.includes('f_auto') || url.includes('q_auto')) return url;

  // Build transformation string
  const transforms: string[] = [];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  // Always add format and quality optimization
  transforms.push('f_auto'); // Automatic format (WebP for supported browsers)
  transforms.push(options.quality ? `q_${options.quality}` : 'q_auto'); // Automatic quality

  const transformString = transforms.join(',');

  // Insert transformations after '/upload/'
  // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123/folder/file.jpg
  // Result: https://res.cloudinary.com/cloud-name/image/upload/TRANSFORMS/v123/folder/file.jpg
  return url.replace(/\/upload\//, `/upload/${transformString}/`);
}

/**
 * Preset transformations for common use cases
 */
export const CloudinaryPresets = {
  /** Cart item thumbnail (80x80, cropped to fill) */
  cartItem: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 300, height: 300, crop: 'fill' }),

  /** Product card image (300x300, cropped to fill) */
  card: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 300, height: 300, crop: 'fill' }),

  /** Product detail image (500px width, maintain aspect ratio) */
  detail: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 500, crop: 'limit' }),

  /** High-resolution image for lightbox/zoom (1200px width, maintain aspect ratio) */
  highRes: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 1200, crop: 'limit' }),

  /** Small thumbnail (100x100, cropped to fill) */
  thumbnail: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 100, height: 100, crop: 'fill' }),

  /** Basic optimization only (auto format & quality, no resizing) */
  optimize: (url: string | null | undefined) => optimizeCloudinaryUrl(url),

  /** Mobile category tile (≈88px rendered, 2× retina = 180px) */
  categoryTile: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 180, height: 180, crop: 'fill' }),

  /** Desktop catalogue card — category hero tile or product grid card (≈80–160px rendered, 2× = 240px) */
  catalogueCard: (url: string | null | undefined) =>
    optimizeCloudinaryUrl(url, { width: 240, height: 240, crop: 'fill' }),
};
