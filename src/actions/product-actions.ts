import { productFormSchema, type ProductFormSchema } from '../types/product-validation';
import type { Product } from '../types/product';

export interface ProductActionState {
  success: boolean;
  product?: Product;
  errors?: Record<string, string>;
  message?: string;
}

export async function saveProductAction(
  prevState: ProductActionState,
  formData: ProductFormSchema & { id?: string }
): Promise<ProductActionState> {
  try {
    // Validate the form data
    const validatedData = productFormSchema.parse(formData);

    // Determine if this is an update or create
    const isUpdate = !!formData.id;
    const url = isUpdate ? `/api/products?id=${formData.id}` : '/api/products';
    const method = isUpdate ? 'PUT' : 'POST';

    // Make API request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    if (result.success) {
      // Handle different response formats
      const savedProduct = result.product || (result.products && result.products[0]);

      return {
        success: true,
        product: savedProduct,
        message: isUpdate ? 'Product updated successfully!' : 'Product created successfully!',
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to save product',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const zodError = error as any;
        const fieldErrors: Record<string, string> = {};

        zodError.errors.forEach((err: any) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });

        return {
          success: false,
          errors: fieldErrors,
          message: 'Please fix the form errors',
        };
      }

      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred',
    };
  }
}