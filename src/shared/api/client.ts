export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    console.info(`[api] GET ${path}`)
    return {} as T
  },
}
