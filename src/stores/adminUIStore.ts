import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUIState {
  // Modal states
  isAddProductModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAddDiscountModalOpen: boolean;

  // Products filter states
  productSearch: string;
  productCategory: string;
  productLimit: number;
  productOffset: number;

  // Orders filter states
  orderSearch: string;
  orderStatus: string;
  orderLimit: number;
  orderOffset: number;

  // Customers filter states
  customerSearch: string;
  customerLimit: number;
  customerOffset: number;

  // Discounts filter states
  discountSearch: string;
  discountActive: boolean | undefined;
  discountLimit: number;
  discountOffset: number;

  // Users filter states
  userSearch: string;
  userRole: string;
  userLimit: number;
  userOffset: number;

  // Modal actions
  openAddProductModal: () => void;
  closeAddProductModal: () => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  openAddDiscountModal: () => void;
  closeAddDiscountModal: () => void;

  // Products filter actions
  setProductSearch: (search: string) => void;
  setProductCategory: (category: string) => void;
  setProductLimit: (limit: number) => void;
  setProductOffset: (offset: number) => void;
  resetProductFilters: () => void;

  // Orders filter actions
  setOrderSearch: (search: string) => void;
  setOrderStatus: (status: string) => void;
  setOrderLimit: (limit: number) => void;
  setOrderOffset: (offset: number) => void;
  resetOrderFilters: () => void;

  // Customers filter actions
  setCustomerSearch: (search: string) => void;
  setCustomerLimit: (limit: number) => void;
  setCustomerOffset: (offset: number) => void;
  resetCustomerFilters: () => void;

  // Discounts filter actions
  setDiscountSearch: (search: string) => void;
  setDiscountActive: (active: boolean | undefined) => void;
  setDiscountLimit: (limit: number) => void;
  setDiscountOffset: (offset: number) => void;
  resetDiscountFilters: () => void;

  // Users filter actions
  setUserSearch: (search: string) => void;
  setUserRole: (role: string) => void;
  setUserLimit: (limit: number) => void;
  setUserOffset: (offset: number) => void;
  resetUserFilters: () => void;
}

export const useAdminUIStore = create<AdminUIState>()(
  persist(
    (set) => ({
      // Initial modal states
      isAddProductModalOpen: false,
      isDeleteModalOpen: false,
      isAddDiscountModalOpen: false,

      // Initial products filter states
      productSearch: '',
      productCategory: '',
      productLimit: 20,
      productOffset: 0,

      // Initial orders filter states
      orderSearch: '',
      orderStatus: '',
      orderLimit: 20,
      orderOffset: 0,

      // Initial customers filter states
      customerSearch: '',
      customerLimit: 20,
      customerOffset: 0,

      // Initial discounts filter states
      discountSearch: '',
      discountActive: undefined,
      discountLimit: 20,
      discountOffset: 0,

      // Initial users filter states
      userSearch: '',
      userRole: '',
      userLimit: 20,
      userOffset: 0,

      // Modal actions
      openAddProductModal: () => set({ isAddProductModalOpen: true }),
      closeAddProductModal: () => set({ isAddProductModalOpen: false }),
      openDeleteModal: () => set({ isDeleteModalOpen: true }),
      closeDeleteModal: () => set({ isDeleteModalOpen: false }),
      openAddDiscountModal: () => set({ isAddDiscountModalOpen: true }),
      closeAddDiscountModal: () => set({ isAddDiscountModalOpen: false }),

      // Products filter actions
      setProductSearch: (search) => set({ productSearch: search, productOffset: 0 }),
      setProductCategory: (category) => set({ productCategory: category, productOffset: 0 }),
      setProductLimit: (limit) => set({ productLimit: limit, productOffset: 0 }),
      setProductOffset: (offset) => set({ productOffset: offset }),
      resetProductFilters: () => set({
        productSearch: '',
        productCategory: '',
        productOffset: 0,
      }),

      // Orders filter actions
      setOrderSearch: (search) => set({ orderSearch: search, orderOffset: 0 }),
      setOrderStatus: (status) => set({ orderStatus: status, orderOffset: 0 }),
      setOrderLimit: (limit) => set({ orderLimit: limit, orderOffset: 0 }),
      setOrderOffset: (offset) => set({ orderOffset: offset }),
      resetOrderFilters: () => set({
        orderSearch: '',
        orderStatus: '',
        orderOffset: 0,
      }),

      // Customers filter actions
      setCustomerSearch: (search) => set({ customerSearch: search, customerOffset: 0 }),
      setCustomerLimit: (limit) => set({ customerLimit: limit, customerOffset: 0 }),
      setCustomerOffset: (offset) => set({ customerOffset: offset }),
      resetCustomerFilters: () => set({
        customerSearch: '',
        customerOffset: 0,
      }),

      // Discounts filter actions
      setDiscountSearch: (search) => set({ discountSearch: search, discountOffset: 0 }),
      setDiscountActive: (active) => set({ discountActive: active, discountOffset: 0 }),
      setDiscountLimit: (limit) => set({ discountLimit: limit, discountOffset: 0 }),
      setDiscountOffset: (offset) => set({ discountOffset: offset }),
      resetDiscountFilters: () => set({
        discountSearch: '',
        discountActive: undefined,
        discountOffset: 0,
      }),

      // Users filter actions
      setUserSearch: (search) => set({ userSearch: search, userOffset: 0 }),
      setUserRole: (role) => set({ userRole: role, userOffset: 0 }),
      setUserLimit: (limit) => set({ userLimit: limit, userOffset: 0 }),
      setUserOffset: (offset) => set({ userOffset: offset }),
      resetUserFilters: () => set({
        userSearch: '',
        userRole: '',
        userOffset: 0,
      }),
    }),
    {
      name: 'admin-ui-storage', // localStorage key
      partialize: (state) => ({
        // Only persist limit values and categories
        productLimit: state.productLimit,
        productCategory: state.productCategory,
        orderLimit: state.orderLimit,
        orderStatus: state.orderStatus,
        customerLimit: state.customerLimit,
        discountLimit: state.discountLimit,
        userLimit: state.userLimit,
        userRole: state.userRole,
      }),
    }
  )
);
