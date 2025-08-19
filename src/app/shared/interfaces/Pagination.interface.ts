export interface Pagination {
  currentPage: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean,
  limit: number,
  total: number,
  totalPages: number
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}