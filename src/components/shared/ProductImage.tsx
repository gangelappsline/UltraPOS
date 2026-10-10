import type { Product } from "../../types";
export function ProductImage({ product }: { product: Product }) {
  return (
    <img
      className="product-image"
      src={`/products/${product.sku.match(/^(LAC|PAN|BEB|FRU|ABA)-\d{3}$/) ? product.sku : "default"}.svg`}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/products/default.svg";
      }}
    />
  );
}
