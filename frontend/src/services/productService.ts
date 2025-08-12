import api from './api';

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  price: number;
  description?: string | null;
}

export interface CreateProductDTO {
  name: string;
  sku: string;
  price: number;
  description?: string | null;
  vendor_id: string; // required by backend
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export const listProducts = async (): Promise<ProductDTO[]> => {
  const res = await api.get('/products/');
  return res.data;
};

export const createProduct = async (payload: CreateProductDTO): Promise<ProductDTO> => {
  const res = await api.post('/products/', payload);
  return res.data;
};

export const updateProduct = async (productId: string, payload: UpdateProductDTO): Promise<ProductDTO> => {
  const res = await api.put(`/products/${productId}`, payload);
  return res.data;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await api.delete(`/products/${productId}`);
};
