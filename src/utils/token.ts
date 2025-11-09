export function formatTokenDate(timestamp?: number): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp * 1000).toLocaleString();
}
