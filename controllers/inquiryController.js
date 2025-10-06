exports.getInquiries = (req, res) => {
  res.json([{ id: 1, name: "John Doe", email: "john@example.com", message: "Interested in safari tours" }]);
};

exports.createInquiry = (req, res) => {
  const { name, email, message } = req.body;
  // Save to DB (mocked)
  res.status(201).json({ success: true, name, email, message });
};