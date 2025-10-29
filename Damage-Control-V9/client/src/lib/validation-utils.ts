import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export interface ValidationResult<T> {
  valid: T[];
  errors: string[];
  total: number;
}

/**
 * Validates an array of items against a Zod schema
 * Returns separated valid items and errors
 */
export async function validateBatch<T>(
  items: unknown[],
  schema: z.ZodSchema<T>,
  options?: {
    checkDuplicates?: (item: T) => Promise<boolean>;
    itemLabel?: string;
  }
): Promise<ValidationResult<T>> {
  const { checkDuplicates, itemLabel = "Item" } = options || {};
  const validItems: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const validatedItem = schema.parse(items[i]);
      
      if (checkDuplicates && await checkDuplicates(validatedItem)) {
        errors.push(`${itemLabel} ${i + 1}: Duplicate entry`);
        continue;
      }
      
      validItems.push(validatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        errors.push(`${itemLabel} ${i + 1}: ${validationError.message}`);
      } else {
        errors.push(`${itemLabel} ${i + 1}: Validation failed`);
      }
    }
  }

  return {
    valid: validItems,
    errors,
    total: items.length
  };
}
