import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type Product = Doc<"products">;

/**
 * Resolve product_images into the product's canonical imageUrls field.
 *
 * Product uploads are stored in Convex Storage and linked through
 * product_images. The legacy imageUrls field remains the seed/import
 * fallback, but uploaded product_images take precedence whenever present.
 */
export async function withResolvedProductImages(
  ctx: QueryCtx,
  products: Product[],
) {
  if (products.length === 0) return products;

  const images = await ctx.db.query("product_images").collect();
  images.sort((a, b) => a.order - b.order || a._creationTime - b._creationTime);

  const resolvedImages = await Promise.all(
    images.map(async (image) => ({
      productId: image.productId,
      url: image.storageId
        ? await ctx.storage.getUrl(image.storageId)
        : image.url ?? null,
    })),
  );
  const urlsByProduct = new Map<string, string[]>();
  for (const image of resolvedImages) {
    if (!image.url) continue;
    const urls = urlsByProduct.get(image.productId) ?? [];
    urls.push(image.url);
    urlsByProduct.set(image.productId, urls);
  }

  return products.map((product) => ({
    ...product,
    imageUrls: urlsByProduct.get(product._id) ?? product.imageUrls,
  }));
}
