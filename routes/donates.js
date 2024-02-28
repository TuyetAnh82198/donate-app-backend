const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");

const {
  add,
  get8Donates,
  getDetail,
  update,
  deleteDonate,
  search,
  deleteMany,
  donateHandler,
  checkPayment,
} = require("../controllers/donates.js");
const isAuth = require("../middleware/isAuth.js");

const route = express.Router();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + file.originalname + "-" + Date.now());
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: fileStorage, fileFilter: fileFilter });

route.post("/add", upload.single("img"), add);
route.get("/get-8-donates/:page", get8Donates);
route.get("/detail/:id", getDetail);
route.post("/update/:id", upload.single("img"), update);
route.get("/delete/:id", deleteDonate);
route.post("/search", search);
route.post("/delete", deleteMany);
route.post(
  "/pay/:id",
  [
    body("amount")
      .trim()
      .notEmpty()
      .withMessage("Bạn chưa nhập số tiền!")
      .custom((value) => {
        return Number(value) > 0;
      })
      .withMessage("Số tiền bạn nhập vào phải lớn hơn 0!"),
  ],
  isAuth,
  donateHandler
);
route.get("/check-payment", checkPayment);

module.exports = route;
