export const login = async (req, res) => {
  // If we reach here, it means the Zod validation passed!
  res.status(200).json({ message: "Validation passed, you are logged in!" });
};