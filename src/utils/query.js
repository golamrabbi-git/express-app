export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Runs a paginated find and returns { data, page, limit, total, totalPages }.
export const paginate = async (Model, filter, { page, limit }, mapDoc) => {
  const [docs, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return { data: docs.map(mapDoc), page, limit, total, totalPages: Math.ceil(total / limit) };
};

// Builds a Mongo update from a fields object. null means "remove this optional field":
// those keys go to $unset, the rest to $set.
export const toUpdate = (fields) => {
  const $set = {};
  const $unset = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) $unset[key] = '';
    else $set[key] = value;
  }
  return { ...(Object.keys($set).length && { $set }), ...(Object.keys($unset).length && { $unset }) };
};
