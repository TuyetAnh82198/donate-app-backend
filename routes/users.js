const express = require("express");
const { body } = require("express-validator");

const {
  signUp,
  login,
  checkLogin,
  logout,
  getUsers,
  search,
  deleteUser,
  resetPass,
  updateRoleToAdmin,
  changePass,
  donateHandler,
  getHistory,
  forgotPass,
  forgotPassHandler,
} = require("../controllers/users.js");
const isAuth = require("../middleware/isAuth.js");

const route = express.Router();

route.post(
  "/sign-up",
  [
    body("email").trim().notEmpty().withMessage("Vui lòng nhập email"),
    body("email").isEmail().withMessage("Email không hợp lệ"),
  ],
  signUp
);
route.post(
  "/login",
  (req, res, next) => {
    if (!req.body.gmail) {
      body("email").trim().notEmpty().withMessage("Vui lòng nhập email");
      body("pass").trim().notEmpty().withMessage("Vui lòng nhập mật khẩu");
      next();
    } else {
      next();
    }
  },
  login
);
route.get("/check-login", checkLogin);
route.get("/logout", logout);
route.get("/get/:page", getUsers);
route.post("/search", search);
route.get("/delete/:id", deleteUser);
route.post("/reset-pass", resetPass);
route.get("/update-role-to-admin/:id", updateRoleToAdmin);
route.post(
  "/change-pass",
  [
    body("oldPass").trim().notEmpty().withMessage("Bạn chưa nhập mật khẩu cũ!"),
    body("newPass")
      .trim()
      .notEmpty()
      .withMessage("Bạn chưa nhập mật khẩu mới!")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu mới phải lớn hơn 8 ký tự!"),
    body("confirmPass")
      .custom((value, { req }) => {
        return value === req.body.newPass;
      })
      .withMessage("Mật khẩu xác nhận không đúng!"),
  ],
  changePass
);
route.get("/get-history/:page", isAuth, getHistory);
route.post("/forgot-pass", forgotPass);
route.post(
  "/change-my-pass",
  [
    body("code").trim().notEmpty().withMessage("Bạn chưa nhập mã code!"),
    body("newPass")
      .trim()
      .notEmpty()
      .withMessage("Bạn chưa nhập mật khẩu mới!")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu mới phải lớn hơn 8 ký tự!"),
    body("confirmPass")
      .custom((value, { req }) => {
        return value === req.body.newPass;
      })
      .withMessage("Mật khẩu xác nhận không đúng!"),
  ],
  forgotPassHandler
);

module.exports = route;
