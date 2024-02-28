const isAuth = (req, res, next) => {
  try {
    if (req.session.user) {
      next();
    } else {
      return res.status(400).json({ message: "have not been logged in yet" });
    }
  } catch (err) {
    return res.status(400).json({ err: err.message });
  }
};
module.exports = isAuth;
