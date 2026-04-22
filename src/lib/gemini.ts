// Semantic search removed - using direct database search instead
export async function basicSearch(units: any[]): string {
  if (!units || units.length === 0) {
    return "No results found matching your search criteria.";
  }
  
  // Format results for display
  const results = units
    .map(u => `${u.name} (${u.type}): ${u.content?.slice(0, 200) || 'No content'}...`)
    .join('\n\n');
  
  return `Found ${units.length} matching asset(s):\n\n${results}`;
}
