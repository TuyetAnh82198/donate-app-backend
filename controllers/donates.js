const fs = require("fs");
const { validationResult } = require("express-validator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const DonateModel = require("../models/Donates.js");
const HistoryModel = require("../models/History.js");
const UserModel = require("../models/Users.js");

//hàm xử lý việc thêm một đợt quyên góp mới
const add = async (req, res) => {
  try {
    if (req.file) {
      // console.log(req.file.path);
      const newDonate = await DonateModel({
        title: req.body.title,
        desc: req.body.desc,
        amount: Number(req.body.amount),
        endDate: req.body.endDate,
        type: req.body.type,
        img: req.file.path,
      });
      await newDonate.save();
      res.status(201).json({ message: "Đã thêm!" });
    } else {
      res.status(400).json({ message: "Ảnh không hợp lệ!" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm trả về danh sách 8 đợt quyên góp sắp đến thời hạn
const get8Donates = async (req, res) => {
  try {
    const pageSize = 8;
    const donates = await DonateModel.find()
      .sort({ endDate: 1 })
      .skip((req.params.page - 1) * pageSize)
      .limit(pageSize);
    // console.log(donates);
    const total = await DonateModel.countDocuments();
    const totalPages = Math.ceil(total / pageSize);
    return res.status(200).json({ result: donates, totalPages: totalPages });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm lấy chi tiết một đợt quyên góp
const getDetail = async (req, res) => {
  try {
    const detail = await DonateModel.findOne({ _id: req.params.id });
    if (!detail) {
      return res.status(400).json({ message: "found no" });
    } else {
      return res.status(200).json({ result: detail });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm cập nhật thông tin của một đợt quyên góp
const update = async (req, res) => {
  try {
    const oldImgObj = await DonateModel.findOne({ _id: req.params.id }, "img");
    // console.log(oldImgObj);
    // console.log(req.body);
    await DonateModel.updateOne(
      { _id: req.params.id },
      {
        title: req.body.title,
        desc: req.body.desc,
        amount: Number(req.body.amount),
        endDate: req.body.endDate,
        type: req.body.type,
        img: req.file ? req.file.path : req.body.img,
      }
    );
    if (req.file) {
      fs.unlink(oldImgObj.img, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc xóa một đợt quyên góp
const deleteDonate = async (req, res) => {
  try {
    // const oldImgObj = await DonateModel.findOne({ _id: req.params.id }, "img");
    await DonateModel.updateOne({ _id: req.params.id }, { isDelete: true });
    // fs.unlink(oldImgObj.img, (err) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    // });
    res.status(200).json({ message: "Xóa thành công!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc tìm kiếm đợt quyên góp theo từ khóa
const search = async (req, res) => {
  try {
    const keywords = req.body.keywords;
    const donates = await DonateModel.find({
      title: {
        $regex: new RegExp(keywords, "i"),
      },
    });
    res.status(200).json({ result: donates });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc xóa nhiều phần tử
const deleteMany = async (req, res) => {
  try {
    const deleteItemsId = req.body.deleteMany;
    // const oldImgs = await DonateModel.find(
    //   { _id: { $in: deleteItemsId } },
    //   "img"
    // );
    // console.log(oldImgs);
    await DonateModel.updateMany(
      { _id: { $in: deleteItemsId } },
      { isDelete: true }
    );
    // for (let i = 0; i < oldImgs.length; i++) {
    //   fs.unlink(oldImgs[i].img, (err) => {
    //     if (err) {
    //       console.error(err);
    //     }
    //   });
    // }
    res.status(200).json({ message: "Xóa thành công!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý một đợt quyên góp
const donateHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errMsg: errs[0] });
    } else {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "vnd",
              product_data: {
                name: `Quyên góp từ thiện`,
              },
              unit_amount: Number(req.body.amount) * 1000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.CLIENT}/payment-success`,
        cancel_url: `${process.env.CLIENT}/payment-cancel`,
      });
      await HistoryModel.deleteOne({
        user: req.session.user._id,
        status: "paying",
      });
      const newUserDonate = new HistoryModel({
        user: req.session.user._id,
        donate: req.params.id,
        amount: Number(req.body.amount),
        note: req.body.note ? req.body.note : "",
        sessionId: session.id,
        status: "paying",
      });
      await newUserDonate.save();
      return res.status(200).json({ id: session.id });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm cập nhật trạng thái và ngày tháng quyên góp thành công
const checkPayment = async (req, res) => {
  try {
    const userDonate = await HistoryModel.findOne({
      user: req.session.user._id,
      status: "paying",
    });

    if (userDonate) {
      const stripeSessionId = userDonate.sessionId;
      const stripeSession = await stripe.checkout.sessions.retrieve(
        stripeSessionId
      );
      if (stripeSession.payment_status === "paid") {
        await HistoryModel.updateOne(
          {
            user: req.session.user._id,
            status: "paying",
          },
          { status: "paid", date: new Date() }
        );
        await DonateModel.updateOne(
          {
            _id: userDonate.donate,
          },
          {
            $inc: {
              currentAmount: userDonate.amount * 1000,
              count: 1,
            },
          }
        );
      }
    }
    return res.status(200).json({ message: "checked!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

module.exports = {
  add,
  get8Donates,
  getDetail,
  update,
  deleteDonate,
  search,
  deleteMany,
  donateHandler,
  checkPayment,
};
