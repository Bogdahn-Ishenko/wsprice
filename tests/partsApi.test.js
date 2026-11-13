import assert from 'node:assert/strict';
import test from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import { getUniqueBrands, searchParts } from '../src/api/partsApi.js';
import partsReducer, { loadBrands, loadOffers } from '../src/store/partsSlice.js';

test('brand lookup sends key and article without analogue flag', async () => {
  let requestedUrl;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(url);
    return Response.json({ goods: [{ brand: 'MEYLE' }] });
  };

  try {
    const goods = await searchParts({ key: 'secret & key', number: '71 # 605' });
    assert.equal(requestedUrl.protocol, 'https:');
    assert.equal(requestedUrl.searchParams.get('key'), 'secret & key');
    assert.equal(requestedUrl.searchParams.get('number'), '71 # 605');
    assert.equal(requestedUrl.searchParams.has('brand'), false);
    assert.equal(requestedUrl.searchParams.has('analogues'), false);
    assert.deepEqual(goods, [{ brand: 'MEYLE' }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('offer lookup sends the selected brand and enables analogues', async () => {
  let requestedUrl;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(url);
    return Response.json({ goods: [{ brand: 'MEYLE', price: 1250 }] });
  };

  try {
    await searchParts({ key: 'key', number: '7160500039S', brand: 'MEYLE' });
    assert.equal(requestedUrl.searchParams.get('brand'), 'MEYLE');
    assert.equal(requestedUrl.searchParams.get('analogues'), 'on');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('brand list is unique regardless of letter case', () => {
  assert.deepEqual(
    getUniqueBrands([{ brand: 'MEYLE' }, { brand: 'meyle' }, { brand: 'CAFFARO' }, {}]),
    ['MEYLE', 'CAFFARO'],
  );
});

test('API error payload is exposed as an error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'Invalid key client!' });

  try {
    await assert.rejects(
      searchParts({ key: 'invalid', number: '01089' }),
      { message: 'Invalid key client!' },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Redux search completes the brand and offer stages', async () => {
  const requestedUrls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const parsedUrl = new URL(url);
    requestedUrls.push(parsedUrl);
    const brand = parsedUrl.searchParams.get('brand');
    const goods = brand
      ? [{ goodsID: 'offer-1', brand, name: 'Ремень приводной', price: 1250 }]
      : [{ brand: 'MEYLE' }, { brand: 'CAFFARO' }];
    return Response.json({ goods });
  };

  try {
    const store = configureStore({ reducer: { parts: partsReducer } });
    await store.dispatch(loadBrands({ key: 'key', number: '7160500039S' })).unwrap();
    assert.deepEqual(store.getState().parts.brands, ['MEYLE', 'CAFFARO']);

    await store.dispatch(
      loadOffers({ key: 'key', number: '7160500039S', brand: 'MEYLE' }),
    ).unwrap();
    assert.equal(store.getState().parts.offers[0].name, 'Ремень приводной');
    assert.equal(requestedUrls[0].searchParams.has('brand'), false);
    assert.equal(requestedUrls[1].searchParams.get('brand'), 'MEYLE');
    assert.equal(requestedUrls[1].searchParams.get('analogues'), 'on');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
