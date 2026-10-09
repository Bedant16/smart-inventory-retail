exports.notFound = (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });

exports.handler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A record with the same unique value (such as SKU) already exists' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected category or supplier does not exist' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
