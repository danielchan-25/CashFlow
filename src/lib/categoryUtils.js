export function buildCategoryTree(categories) {
  const map = {}
  const roots = []
  categories.forEach(c => { map[c.id] = { ...c, children: [] } })
  categories.forEach(c => {
    if (c.parent_id != null && c.parent_id !== '' && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id])
    } else if (c.parent_id == null || c.parent_id === '') {
      roots.push(map[c.id])
    }
  })
  roots.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return { map, roots }
}
