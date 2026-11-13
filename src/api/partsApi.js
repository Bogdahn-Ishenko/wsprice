const API_URL = 'http://api.favorit-parts.ru/hs/hsprice/';

export async function searchParts({ key, number, brand, signal }) {
  const params = new URLSearchParams({ key, number });

  if (brand) {
    params.set('brand', brand);
    params.set('analogues', 'on');
  }

  const response = await fetch(`${API_URL}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Ошибка API: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('API вернул некорректный ответ');
  }
  if (payload.error) {
    throw new Error(payload.error);
  }
  if (!Array.isArray(payload.goods)) {
    throw new Error('В ответе API отсутствует список товаров');
  }

  return payload.goods;
}

export function getUniqueBrands(goods) {
  const brands = new Map();

  for (const item of goods) {
    const brand = typeof item?.brand === 'string' ? item.brand.trim() : '';
    if (brand && !brands.has(brand.toLocaleLowerCase())) {
      brands.set(brand.toLocaleLowerCase(), brand);
    }
  }

  return [...brands.values()];
}
