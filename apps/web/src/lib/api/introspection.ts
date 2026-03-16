import { apiClient } from './client';

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export async function introspectTables(
  connectionId: string,
): Promise<{ tables: string[] }> {
  const response = await apiClient.get<{ tables: string[] }>(
    `/connections/${connectionId}/introspect/tables`,
  );

  return response.data;
}

export async function introspectColumns(
  connectionId: string,
  table: string,
): Promise<{ columns: ColumnInfo[] }> {
  const response = await apiClient.get<{ columns: ColumnInfo[] }>(
    `/connections/${connectionId}/introspect/tables/${encodeURIComponent(table)}/columns`,
  );

  return response.data;
}

export async function testDbQuery(
  connectionId: string,
  query: string,
  params: unknown[],
): Promise<{ rows: unknown[]; rowCount: number }> {
  const response = await apiClient.post<{ rows: unknown[]; rowCount: number }>(
    `/connections/${connectionId}/introspect/query`,
    { query, params },
  );

  return response.data;
}
