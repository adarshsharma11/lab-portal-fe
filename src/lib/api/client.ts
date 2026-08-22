export type ApiResponse<T> = Readonly<{ data: T; message?: string }>;
export const apiClient = { async request<T>(operation: () => Promise<T>): Promise<ApiResponse<T>> { try { return { data: await operation() }; } catch (error) { throw error instanceof Error ? error : new Error("Unexpected API error."); } } };
