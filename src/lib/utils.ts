export function generateId(): string {
  return crypto.randomUUID();
}

export function today(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function now(): string {
  return new Date().toISOString();
}
