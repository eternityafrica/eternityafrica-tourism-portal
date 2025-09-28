exports.getUsers = (req, res) => {
  res.json([{ id: 1, username: "admin", email: "admin@eternityafrica.com" }]);
};

exports.createUser = (req, res) => {
  const { username, email, password } = req.body;
  // Save to DB (mocked)
  res.status(201).json({ success: true, username, email });
};