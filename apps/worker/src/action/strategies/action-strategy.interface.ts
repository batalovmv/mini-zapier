export interface ActionStrategy {
  execute(
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown>;
}
