function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Цена не указана';
  }

  const value = Number(price);
  return Number.isFinite(value)
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
    : `${price} ₽`;
}

function getStock(item) {
  if (Array.isArray(item.warehouses) && item.warehouses.length > 0) {
    return item.warehouses.reduce((total, warehouse) => total + (Number(warehouse.stock) || 0), 0);
  }
  return Number(item.count) || 0;
}

export default function OffersList({ offers }) {
  if (offers.length === 0) {
    return <p className="empty-state">По выбранному производителю предложений не найдено</p>;
  }

  return (
    <div className="offers-list">
      {offers.map((offer, index) => (
        <article className="offer-card" key={offer.goodsID || `${offer.brand}-${offer.number}-${index}`}>
          <div className="offer-main">
            <div className="offer-title">
              <h3>{offer.name || 'Запчасть без названия'}</h3>
              <span className="brand-tag">{offer.brand || 'Производитель не указан'}</span>
            </div>
            <div className="offer-meta">Артикул: {offer.number || '—'}</div>
          </div>
          <div className="offer-details">
            <div>
              <span className="detail-label">Цена</span>
              <strong className="offer-price">{formatPrice(offer.price)}</strong>
            </div>
            <div>
              <span className="detail-label">Остаток</span>
              <strong>{getStock(offer)} шт.</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
