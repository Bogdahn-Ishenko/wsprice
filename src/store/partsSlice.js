import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUniqueBrands, searchParts } from '../api/partsApi.js';

export const loadBrands = createAsyncThunk(
  'parts/loadBrands',
  async ({ key, number }, { signal, rejectWithValue }) => {
    try {
      const goods = await searchParts({ key, number, signal });
      return { brands: getUniqueBrands(goods), number };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      return rejectWithValue(error.message || 'Не удалось загрузить производителей');
    }
  },
);

export const loadOffers = createAsyncThunk(
  'parts/loadOffers',
  async ({ key, number, brand }, { signal, rejectWithValue }) => {
    try {
      const goods = await searchParts({ key, number, brand, signal });
      return { goods, number, brand };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      return rejectWithValue(error.message || 'Не удалось загрузить предложения');
    }
  },
);

const initialState = {
  brands: [],
  offers: [],
  selectedBrand: '',
  brandsStatus: 'idle',
  offersStatus: 'idle',
  brandsError: '',
  offersError: '',
  brandsRequestId: null,
  offersRequestId: null,
};

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    clearSearch(state) {
      state.brands = [];
      state.offers = [];
      state.selectedBrand = '';
      state.brandsStatus = 'idle';
      state.offersStatus = 'idle';
      state.brandsError = '';
      state.offersError = '';
      state.brandsRequestId = null;
      state.offersRequestId = null;
    },
    selectBrand(state, action) {
      state.selectedBrand = action.payload;
      state.offers = [];
      state.offersStatus = 'idle';
      state.offersError = '';
      state.offersRequestId = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadBrands.pending, (state, action) => {
        state.brands = [];
        state.offers = [];
        state.selectedBrand = '';
        state.brandsStatus = 'loading';
        state.offersStatus = 'idle';
        state.brandsError = '';
        state.offersError = '';
        state.brandsRequestId = action.meta.requestId;
        state.offersRequestId = null;
      })
      .addCase(loadBrands.fulfilled, (state, action) => {
        if (state.brandsRequestId !== action.meta.requestId) {
          return;
        }
        state.brands = action.payload.brands;
        state.brandsStatus = 'succeeded';
        state.brandsRequestId = null;
      })
      .addCase(loadBrands.rejected, (state, action) => {
        if (state.brandsRequestId !== action.meta.requestId) {
          return;
        }
        state.brandsRequestId = null;
        if (action.meta.aborted) {
          state.brandsStatus = 'idle';
          return;
        }
        state.brandsStatus = 'failed';
        state.brandsError = action.payload || action.error.message || 'Не удалось загрузить производителей';
      })
      .addCase(loadOffers.pending, (state, action) => {
        state.selectedBrand = action.meta.arg.brand;
        state.offers = [];
        state.offersStatus = 'loading';
        state.offersError = '';
        state.offersRequestId = action.meta.requestId;
      })
      .addCase(loadOffers.fulfilled, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) {
          return;
        }
        state.offers = action.payload.goods;
        state.offersStatus = 'succeeded';
        state.offersRequestId = null;
      })
      .addCase(loadOffers.rejected, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) {
          return;
        }
        state.offersRequestId = null;
        if (action.meta.aborted) {
          state.offersStatus = 'idle';
          return;
        }
        state.offersStatus = 'failed';
        state.offersError = action.payload || action.error.message || 'Не удалось загрузить предложения';
      });
  },
});

export const { clearSearch, selectBrand } = partsSlice.actions;
export default partsSlice.reducer;
