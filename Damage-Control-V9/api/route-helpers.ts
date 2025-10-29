import type { Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export function handleError(res: Response, error: unknown, defaultMessage: string, defaultStatus: number = 500) {
  if (error instanceof z.ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({ error: validationError.message });
  }
  
  const message = error instanceof Error ? error.message : defaultMessage;
  const status = (error as any)?.status || (error as any)?.statusCode || defaultStatus;
  return res.status(status).json({ error: message });
}

export async function validateBulkItems<T>(
  items: unknown[],
  schema: z.ZodSchema<T>,
  checkDuplicate?: (item: T) => Promise<boolean>,
  itemLabel: string = "Item",
  getIdentifier?: (item: T) => string
): Promise<{
  validItems: T[];
  errors: string[];
}> {
  const validItems: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const validatedItem = schema.parse(items[i]);
      
      if (checkDuplicate && await checkDuplicate(validatedItem)) {
        const identifier = getIdentifier ? ` (${getIdentifier(validatedItem)})` : '';
        errors.push(`${itemLabel} ${i + 1}${identifier}: Duplicate entry`);
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

  return { validItems, errors };
}
