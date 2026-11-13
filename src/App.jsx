import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from './components/Loader';
import OffersList from './components/OffersList';
import { clearSearch, loadBrands, loadOffers, selectBrand } from './store/partsSlice';

export default function App() {
  const dispatch = useDispatch();
  const {
    brands,
    offers,
    selectedBrand,
    brandsStatus,
    offersStatus,
    brandsError,
    offersError,
  } = useSelector((state) => state.parts);
  const [apiKey, setApiKey] = useState('');
  const [number, setNumber] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const brandsRequest = useRef(null);
  const offersRequest = useRef(null);

  useEffect(() => {
    if (!searchEnabled || !apiKey.trim() || !number.trim()) {
      return undefined;
    }

    const request = setTimeout(() => {
      brandsRequest.current?.abort();
      brandsRequest.current = dispatch(loadBrands({ key: apiKey.trim(), number: number.trim() }));
    }, 400);

    return () => clearTimeout(request);
  }, [apiKey, dispatch, number, searchEnabled]);

  function handleNumberChange(event) {
    setNumber(event.target.value);
    setSearchEnabled(true);
    brandsRequest.current?.abort();
    offersRequest.current?.abort();
    dispatch(clearSearch());
  }

  function handleKeyChange(event) {
    setApiKey(event.target.value);
    if (searchEnabled) {
      brandsRequest.current?.abort();
      offersRequest.current?.abort();
      dispatch(clearSearch());
    }
  }

  function handleBrandSelect(brand) {
    if (!brand || brand === selectedBrand && offersStatus === 'loading') {
      return;
    }
    offersRequest.current?.abort();
    dispatch(selectBrand(brand));
    offersRequest.current = dispatch(
      loadOffers({ key: apiKey.trim(), number: number.trim(), brand }),
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand-logo" href="/" aria-label="WSPrice — на главную">
          <span className="logo-mark">W</span>
          <span>WSPrice</span>
        </a>
        <span className="topbar-note">Каталог автозапчастей</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Автозапчасти по артикулу</h1>
          <p>Выберите производителя, чтобы увидеть аналоги, цены и остатки</p>
        </div>
        <div className="search-panel">
          <label className="input-label" htmlFor="api-key">Ключ API</label>
          <input
            id="api-key"
            className="text-input"
            type="password"
            autoComplete="off"
            placeholder="Введите ключ API"
            value={apiKey}
            onChange={handleKeyChange}
          />
          <label className="input-label" htmlFor="part-number">Артикул</label>
          <input
            id="part-number"
            className="text-input part-number-input"
            type="search"
            autoComplete="off"
            placeholder="Например, 7160500039S"
            value={number}
            onChange={handleNumberChange}
          />
          {!apiKey.trim() && number.trim() && (
            <p className="helper-text">Чтобы начать поиск, сначала введите ключ доступа к API</p>
          )}
          {apiKey.trim() && number.trim() && brandsStatus === 'loading' && (
            <Loader label="Ищем производителей…" />
          )}
          {brandsError && <p className="error-message" role="alert">{brandsError}</p>}
          {brandsStatus === 'succeeded' && brands.length === 0 && (
            <p className="empty-state">Производители по этому артикулу не найдены</p>
          )}
          {brands.length > 0 && (
            <div className="brand-picker">
              <span className="input-label">Производитель</span>
              <div className="brand-options">
                {brands.map((brand) => (
                  <button
                    className={`brand-option ${selectedBrand === brand ? 'selected' : ''}`}
                    key={brand}
                    type="button"
                    aria-pressed={selectedBrand === brand}
                    onClick={() => handleBrandSelect(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="results-section" aria-live="polite">
        <div className="section-heading">
          <div>
            <h2>{selectedBrand ? `Предложения: ${selectedBrand}` : 'Предложения и аналоги'}</h2>
          </div>
          {offersStatus === 'succeeded' && offers.length > 0 && (
            <span className="result-count">{offers.length} позиций</span>
          )}
        </div>

        {offersStatus === 'loading' && <Loader label="Загружаем цены и остатки…" />}
        {offersError && <p className="error-message" role="alert">{offersError}</p>}
        {offersStatus === 'succeeded' && <OffersList offers={offers} />}
        {offersStatus === 'idle' && !offersError && (
          <div className="hint-card">
            <p>Введите артикул и выберите производителя, чтобы увидеть цены и остатки</p>
          </div>
        )}
      </section>
      <footer className="footer">Источник данных: API Favorit Parts</footer>
    </main>
  );
}
