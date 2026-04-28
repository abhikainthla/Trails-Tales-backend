import Journal from "../models/Journal.js";

export const createJournal = async (req, res) => {
  const journal = await Journal.create({
    ...req.body,
    user: req.user.id,
  });

  res.json(journal);
};

export const getJournals = async (req, res) => {
  const journals = await Journal.find().populate("user", "name avatar");
  res.json(journals);
};
