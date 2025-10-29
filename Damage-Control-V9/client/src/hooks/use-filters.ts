import { useState, useMemo } from "react";

type FilterConfig<T> = {
  [K in keyof Partial<T>]: T[K] extends string | number ? T[K] | "all" : never;
};

/**
 * Generic hook for managing multiple filters with efficient memoization
 */
export function useFilters<T extends Record<string, any>>(
  data: T[],
  filterKeys: (keyof T)[]
) {
  const [filters, setFilters] = useState<Record<string, any>>(
    Object.fromEntries(filterKeys.map(key => [key, "all"]))
  );

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return filterKeys.every(key => {
        const filterValue = filters[String(key)];
        if (filterValue === "all") return true;
        
        const itemValue = item[key];
        if (Array.isArray(itemValue)) {
          return itemValue.includes(filterValue);
        }
        return itemValue === filterValue;
      });
    });
  }, [data, filters, filterKeys]);

  const setFilter = (key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(Object.fromEntries(filterKeys.map(key => [key, "all"])));
  };

  return {
    filters,
    filteredData,
    setFilter,
    resetFilters
  };
}
