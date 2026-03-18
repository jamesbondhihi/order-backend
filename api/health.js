module.exports = (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
};
