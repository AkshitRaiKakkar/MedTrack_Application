import React, { useMemo } from 'react';

const TYPE_LABEL = {
  FACILITY: "Facility",
  FLOOR: "Floor",
  WING: "Wing / Ward",
  ROOM: "Room",
  STORAGE: "Storage Area",
};

/**
 * Walks a flat location list up the parentId chain, returning root→node.
 * Shared by the picker and the inventory breadcrumb.
 */
export const getBreadcrumbPath = (locations = [], locationId) => {
  if (locationId == null || !locations.length) return [];
  const map = new Map(locations.map((loc) => [loc.id, loc]));
  const chain = [];
  let id = locationId;
  while (id != null && map.has(id)) {
    chain.unshift(map.get(id));
    id = map.get(id).parentId;
  }
  return chain;
};

const levelLabel = (options) =>
  options[0] ? TYPE_LABEL[options[0].locationType] || "Location" : "Location";

const selectClass =
  "w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-bold transition-all cursor-pointer";

/**
 * Cascading facility-location picker (issue #745).
 *
 * Renders one select per depth of the tree (Facility → Floor → Wing/Ward → Room/Area).
 * Selecting a non-leaf node at a depth also submits that node as the chosen location, so an
 * asset can be pinned to a floor instead of a room; deeper selects simply refine further.
 */
export default function LocationPicker({ locations = [], value = null, onChange, disabled = false }) {
  const childrenOf = useMemo(() => {
    const m = new Map();
    m.set("root", []);
    locations.forEach((loc) => {
      const key = loc.parentId == null ? "root" : loc.parentId;
      const bucket = m.get(key);
      if (bucket) bucket.push(loc);
    });
    return m;
  }, [locations]);

  const path = useMemo(
    () => getBreadcrumbPath(locations, value),
    [locations, value]
  );

  const levels = [];
  for (let depth = 0; depth < 5; depth++) {
    const parentId = depth === 0 ? null : path[depth - 1]?.id ?? null;
    const options = childrenOf.get(parentId == null ? "root" : parentId) || [];
    const selectedNode = path[depth];
    levels.push({ depth, options, selectedNode });
    // Stop once the current selection is a leaf (or nothing is selected yet).
    if (!selectedNode) break;
    if (!(childrenOf.get(selectedNode.id) || []).length) break;
  }

  if (!levels.length || locations.length === 0) {
    return (
      <p className="text-slate-400 text-sm font-medium">
        No facility locations configured yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {levels.map(({ depth, options, selectedNode }) => (
        <div key={depth} className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            {levelLabel(options)}
          </label>
          <select
            value={selectedNode ? selectedNode.id : ""}
            disabled={disabled || options.length === 0}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              onChange(id);
            }}
            className={selectClass}
          >
            <option value="">
              {options.length ? `Select ${levelLabel(options)}...` : "No options"}
            </option>
            {options.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}