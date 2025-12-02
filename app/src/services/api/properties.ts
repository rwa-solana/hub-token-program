import { apiClient, ApiResponse } from './client';
import { Property, PropertyDetail, PropertyFilter } from '@/types';

export const propertiesApi = {
  getAll: async (filter?: PropertyFilter): Promise<Property[]> => {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.minValue) params.append('minValue', filter.minValue.toString());
    if (filter?.maxValue) params.append('maxValue', filter.maxValue.toString());
    if (filter?.propertyType) params.append('propertyType', filter.propertyType);

    const response = await apiClient.get<any, ApiResponse<Property[]>>(
      `/properties?${params.toString()}`
    );
    return response.data;
  },

  getByMint: async (mint: string): Promise<PropertyDetail> => {
    const response = await apiClient.get<any, ApiResponse<PropertyDetail>>(
      `/properties/${mint}`
    );
    return response.data;
  },
};
