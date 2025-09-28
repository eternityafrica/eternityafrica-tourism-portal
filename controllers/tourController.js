exports.getTours = (req, res) => {
  res.json([{ id: 1, title: "Serengeti Safari", days: 5 }]);
};

exports.createTour = (req, res) => {
  const { title, days } = req.body;
  // Save to DB (mocked)
  res.status(201).json({ success: true, title, days });
};