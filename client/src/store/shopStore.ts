import { create } from 'zustand'
import type { MenuKey, ProductDraft, ProductBasicKey, ProductMediaKey, ProductPricingKey, ProductLogisticsKey } from '../types'
import type { LoginResult, UserInfo } from '../api/auth'

type ShopState = {
  token: string | null
  currentUser: UserInfo | null
  setAuth: (result: LoginResult) => void

  activeMenu: MenuKey
  setActiveMenu: (key: MenuKey) => void

  darkMode: boolean
  toggleDarkMode: () => void

  productDraft: ProductDraft
  updateProductBasic: <K extends ProductBasicKey>(key: K, value: ProductDraft['basic'][K]) => void
  updateProductMedia: <K extends ProductMediaKey>(key: K, value: ProductDraft['media'][K]) => void
  updateProductPricing: <K extends ProductPricingKey>(key: K, value: ProductDraft['pricing'][K]) => void
  updateProductLogistics: <K extends ProductLogisticsKey>(key: K, value: ProductDraft['logistics'][K]) => void
  updateProductSpecName: (specId: string, name: string) => void
  updateProductSpecValues: (specId: string, values: string[]) => void
  resetProductDraft: () => void
}

const initialProductDraft: ProductDraft = {
  basic: { title: '', subtitle: '', category: '', status: 'draft' },
  media: { coverUrl: '' },
  pricing: { price: 0, marketPrice: 0, stock: 0 },
  logistics: { freightTemplate: '全国包邮', deliveryPromise: '48 小时内发货', afterSale: '7 天无理由退换' },
  specs: [
    { id: 'color', name: '颜色', values: [] },
    { id: 'size', name: '尺码', values: [] },
  ],
}

export const useShopStore = create<ShopState>((set) => ({
  token: localStorage.getItem('token'),
  currentUser: null,
  setAuth: (result) => set({ token: result.token, currentUser: result.user }),

  activeMenu: 'dashboard',
  setActiveMenu: (key) => set({ activeMenu: key }),

  darkMode: localStorage.getItem('darkMode') === '1',
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode
    localStorage.setItem('darkMode', next ? '1' : '0')
    return { darkMode: next }
  }),

  productDraft: initialProductDraft,
  updateProductBasic: (key, value) => set((s) => ({ productDraft: { ...s.productDraft, basic: { ...s.productDraft.basic, [key]: value } } })),
  updateProductMedia: (key, value) => set((s) => ({ productDraft: { ...s.productDraft, media: { ...s.productDraft.media, [key]: value } } })),
  updateProductPricing: (key, value) => set((s) => ({ productDraft: { ...s.productDraft, pricing: { ...s.productDraft.pricing, [key]: value } } })),
  updateProductLogistics: (key, value) => set((s) => ({ productDraft: { ...s.productDraft, logistics: { ...s.productDraft.logistics, [key]: value } } })),
  updateProductSpecName: (specId, name) => set((s) => ({ productDraft: { ...s.productDraft, specs: s.productDraft.specs.map((sp) => (sp.id === specId ? { ...sp, name } : sp)) } })),
  updateProductSpecValues: (specId, values) => set((s) => ({ productDraft: { ...s.productDraft, specs: s.productDraft.specs.map((sp) => (sp.id === specId ? { ...sp, values } : sp)) } })),
  resetProductDraft: () => set({ productDraft: initialProductDraft }),
}))
