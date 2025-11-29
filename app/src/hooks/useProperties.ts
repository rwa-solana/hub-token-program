import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/services/api';
import { PropertyFilter } from '@/types';

export function useProperties(filter?: PropertyFilter) {
  return useQuery({
    queryKey: ['properties', filter],
    queryFn: () => propertiesApi.getAll(filter),
  });
}

export function useProperty(mint: string) {
  return useQuery({
    queryKey: ['property', mint],
    queryFn: () => propertiesApi.getByMint(mint),
    enabled: !!mint,
  });
}
