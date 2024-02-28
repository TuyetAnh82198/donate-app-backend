const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const UserModel = require("../models/Users.js");
const HistoryModel = require("../models/History.js");

//hàm xử lý việc đăng ký
const signUp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errMsg: errs[0] });
    } else {
      const existingUser = await UserModel.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email này đã đăng ký, vui lòng nhập một email khác",
        });
      } else {
        const buffer = crypto.randomBytes(8);
        const randomPass = buffer.toString("hex");
        const newUser = new UserModel({
          email: req.body.email,
          pass: bcrypt.hashSync(randomPass, 8),
        });
        await newUser.save();
        const transport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "tailieu22072023@gmail.com",
            pass: "jkal cjew kxwe kmdn",
          },
        });
        await transport.sendMail({
          from: "tailieu22072023@gmail.com",
          to: req.body.email,
          subject: "Đăng ký thành công",
          html: `<h5>Mật khẩu đăng nhập của bạn là: ${randomPass}</h5>`,
        });
        return res.status(201).json({ message: "Đăng ký thành công!" });
      }
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc admin reset mật khẩu
const resetPass = async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email });
    // console.log(existingUser);
    if (existingUser) {
      const buffer = crypto.randomBytes(8);
      const randomPass = buffer.toString("hex");
      await UserModel.updateOne(
        { email: req.body.email },
        {
          pass: bcrypt.hashSync(randomPass, 8),
        }
      );
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "tailieu22072023@gmail.com",
          pass: "jkal cjew kxwe kmdn",
        },
      });
      await transport.sendMail({
        from: "tailieu22072023@gmail.com",
        to: req.body.email,
        subject: "Đặt lại mật khẩu",
        html: `<h5>Mật khẩu đăng nhập mới của bạn là: ${randomPass}</h5>`,
      });
      return res.status(200).json({
        message: "Mật khẩu mới đã được gửi vào email của người dùng!",
      });
    } else {
      return res.status(400).json({
        message: "Email này chưa đăng ký!",
      });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc đăng nhập
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errMsg: errs[0] });
    } else {
      if (req.body.gmail) {
        const existingUser = await UserModel.findOne({ email: req.body.gmail });
        if (!existingUser) {
          const newUser = new UserModel({
            email: req.body.gmail,
          });
          await newUser.save();
        }
        const user = await UserModel.findOne({ email: req.body.gmail });
        user.pass = false;
        user.code = undefined;
        user.date = undefined;
        req.session.user = user;
        return res.status(200).json({ message: "Đăng nhập thành công!" });
      } else {
        const existingUser = await UserModel.findOne({ email: req.body.email });
        if (existingUser) {
          const isCorrectPass = bcrypt.compareSync(
            req.body.pass,
            existingUser.pass
          );
          if (isCorrectPass) {
            existingUser.pass = true;
            existingUser.code = undefined;
            existingUser.date = undefined;
            req.session.user = existingUser;
            return res.status(200).json({ message: "Đăng nhập thành công!" });
          } else {
            return res.status(400).json({
              message: "Sai email hoặc mật khẩu!",
            });
          }
        } else {
          res.status(400).json({
            message: "Sai email hoặc mật khẩu!",
          });
        }
      }
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm kiểm tra người dùng đã đăng nhập chưa
const checkLogin = (req, res) => {
  try {
    // console.log(req.session.user);
    if (req.session.user) {
      return res.status(200).json({
        email: req.session.user.email,
        role: req.session.user.role,
        withPass: req.session.user.pass,
      });
    } else {
      return res.status(400).json({ message: "have not been logged in yet." });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc đăng xuất
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(400).json({ err: err.message });
    } else {
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Đăng xuất thành công!" });
    }
  });
};

//hàm trả về danh sách người dùng, mỗi trang 8 người dùng
const getUsers = async (req, res) => {
  try {
    const pageSize = 8;
    const users = await UserModel.find()
      .skip((req.params.page - 1) * pageSize)
      .limit(pageSize);
    // console.log(donates);
    const total = await UserModel.countDocuments();
    const totalPages = Math.ceil(total / pageSize);
    return res.status(200).json({ result: users, totalPages: totalPages });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc tìm kiếm người dùng theo từ khóa
const search = async (req, res) => {
  try {
    const keywords = req.body.keywords;
    const users = await UserModel.find({
      email: {
        $regex: new RegExp(keywords, "i"),
      },
    });
    res.status(200).json({ result: users });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc xóa một người dùng
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findOne({ _id: userId });
    // console.log(user);
    if (user) {
      if (user.role === "client") {
        await UserModel.deleteOne({ _id: userId });
        res.status(200).json({ message: "Xóa thành công!" });
      } else if (user.role === "admin") {
        res.status(400).json({ message: "Không thể xóa người dùng là admin!" });
      }
    } else {
      res.status(400).json({ message: "Xóa không thành công!" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc đổi role của client thành admin
const updateRoleToAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    await UserModel.updateOne({ _id: req.params.id }, { role: "admin" });
    const users = await UserModel.find();
    return res.status(200).json({ result: users });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc thay đổi mật khẩu
const changePass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errMsg: errs[0] });
    } else {
      const newPass = bcrypt.hashSync(req.body.newPass, 8);
      await UserModel.updateOne(
        { email: req.session.user.email },
        { pass: newPass }
      );
      return res.status(200).json({ message: "Cập nhật thành công!" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm trả về danh sách lịch sử quyên góp của người dùng, mỗi trang 8 kết quả
const getHistory = async (req, res) => {
  try {
    const pageSize = 8;
    const donates = await HistoryModel.find({
      user: req.session.user._id,
    })
      .populate("donate")
      .skip((req.params.page - 1) * pageSize)
      .limit(pageSize);
    // console.log(donates);
    const total = await HistoryModel.countDocuments();
    const totalPages = Math.ceil(total / pageSize);
    return res.status(200).json({ result: donates, totalPages: totalPages });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc quên mật khẩu
const forgotPass = async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email });
    // console.log(existingUser);
    if (existingUser) {
      const buffer = crypto.randomBytes(8);
      const randomCode = buffer.toString("hex");
      await UserModel.updateOne(
        { email: req.body.email },
        { code: randomCode, date: new Date() }
      );
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "tailieu22072023@gmail.com",
          pass: "jkal cjew kxwe kmdn",
        },
      });
      await transport.sendMail({
        from: "tailieu22072023@gmail.com",
        to: req.body.email,
        subject: "Đặt lại mật khẩu",
        html: `<h5>Code để thay đổi mật khẩu của bạn là: ${randomCode}</h5><h5>Click vào link này để cập nhật mật khẩu mới của bạn: ${process.env.CLIENT}/forgot-pass</h5>`,
      });
      return res.status(200).json({
        message: "Vui lòng kiểm tra email của bạn!",
      });
    } else {
      return res.status(400).json({
        message: "Email này chưa đăng ký!",
      });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc thay đổi mật khẩu khi quên mật khẩu
const forgotPassHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errMsg: errs[0] });
    } else {
      const existingUser = await UserModel.findOne({
        code: req.body.code,
        date: { $gte: new Date(Date.now() - 30 * 60000) },
      });
      // console.log(existingUser);
      if (existingUser) {
        const newPass = bcrypt.hashSync(req.body.newPass, 8);
        await UserModel.updateOne(
          { email: existingUser.email },
          { pass: newPass }
        );
        return res.status(200).json({ message: "Cập nhật thành công!" });
      } else {
        return res
          .status(400)
          .json({ message: "Mã code đã nhập không đúng hoặc đã hết hạn!" });
      }
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

module.exports = {
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
  getHistory,
  forgotPass,
  forgotPassHandler,
};
