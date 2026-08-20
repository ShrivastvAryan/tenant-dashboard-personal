"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

/**
 * Standardized API response format returned by server actions or REST handlers.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Configuration options for generic TanStack Query CRUD hooks.
 */
export interface UseCrudOptions<TData, TCreatePayload, TUpdatePayload, TId = string> {
  /**
   * Base Query Key for the entity resource (e.g. ['webhooks'], ['apiKeys', tenantId])
   */
  queryKey: QueryKey;

  /**
   * Function to fetch entity list or data
   */
  fetcher?: () => Promise<ApiResponse<TData>>;

  /**
   * Function to create a new entity
   */
  creater?: (payload: TCreatePayload) => Promise<ApiResponse<any>>;

  /**
   * Function to update an existing entity by ID
   */
  updater?: (id: TId, payload: TUpdatePayload) => Promise<ApiResponse<any>>;

  /**
   * Function to delete an entity by ID
   */
  deleter?: (id: TId) => Promise<ApiResponse<any>>;

  /**
   * Optional custom options for the read query
   */
  queryOptions?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, "queryKey" | "queryFn">;
}

/**
 * Generic TanStack Query CRUD Hook.
 * Provides a unified, type-safe interface for Create, Read, Update, and Delete requests
 * with automatic query invalidation, caching, and state management.
 */
export function useCrud<TData, TCreatePayload = any, TUpdatePayload = any, TId = string>({
  queryKey,
  fetcher,
  creater,
  updater,
  deleter,
  queryOptions,
}: UseCrudOptions<TData, TCreatePayload, TUpdatePayload, TId>) {
  const queryClient = useQueryClient();

  // READ (Query)
  const query = useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      if (!fetcher) throw new Error("Fetcher function was not provided.");
      const res = await fetcher();
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch resource");
      }
      return res.data as TData;
    },
    enabled: Boolean(fetcher),
    ...queryOptions,
  });

  // CREATE (Mutation)
  const createMutation = useMutation<any, Error, TCreatePayload>({
    mutationFn: async (payload: TCreatePayload) => {
      if (!creater) throw new Error("Creater function was not provided.");
      const res = await creater(payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to create resource");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // UPDATE (Mutation)
  const updateMutation = useMutation<any, Error, { id: TId; payload: TUpdatePayload }>({
    mutationFn: async ({ id, payload }: { id: TId; payload: TUpdatePayload }) => {
      if (!updater) throw new Error("Updater function was not provided.");
      const res = await updater(id, payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to update resource");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // DELETE (Mutation)
  const deleteMutation = useMutation<any, Error, TId>({
    mutationFn: async (id: TId) => {
      if (!deleter) throw new Error("Deleter function was not provided.");
      const res = await deleter(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete resource");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    // Read Query State & Actions
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Create State & Actions
    createItem: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update State & Actions
    updateItem: (id: TId, payload: TUpdatePayload) => updateMutation.mutate({ id, payload }),
    updateAsync: (id: TId, payload: TUpdatePayload) => updateMutation.mutateAsync({ id, payload }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete State & Actions
    deleteItem: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Expose raw query & mutation objects for granular control
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
