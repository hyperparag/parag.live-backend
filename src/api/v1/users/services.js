const { User, Product, Deposit, Transactions } = require("../models");
const { payReferralBonus } = require("../utils/referral");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Short, human-typeable referral code. Ambiguous characters (0/O, 1/I) are
 * excluded because people read these off a screen and retype them.
 */
const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateReferralCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let code = "";
    for (let i = 0; i < 8; i += 1) {
      code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
    }
    const taken = await User.exists({ referralCode: code });
    if (!taken) return code;
  }
  // Astronomically unlikely; fall back to something guaranteed unique.
  return "R" + Date.now().toString(36).toUpperCase();
};
exports.generateReferralCode = generateReferralCode;

// Never hand the password hash back to a client.
const withoutPassword = (doc) => {
  const obj = doc && doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  return obj;
};

const generateJwtToken = ({
  _id,
  firstName,
  lastName,
  avater,
  email,
  role,
}) => {
  return jwt.sign(
    { _id, firstName, lastName, avater, email, role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

exports.saveUser = async (req, res) => {
  const { given_name, family_name, email, picture } = req.body;

  try {
    const isExist = await User.findOne({ email: email });

    if (isExist) {
      // Backfill a referral code for accounts created before the programme.
      if (!isExist.referralCode) {
        isExist.referralCode = await generateReferralCode();
        await isExist.save();
      }
      return res.status(201).json({
        message: "success",
        isExist,
        token: generateJwtToken(isExist),
      });
    }
    const data = {
      firstName: given_name,
      lastName: family_name,
      email,
      avater: picture,
      credit: 0,
      referralCode: await generateReferralCode(),
    };

    const createdUser = await User.create(data);
    return res.status(201).json({
      message: "success",
      isExist: createdUser,
      token: generateJwtToken(createdUser),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Invalid" });
  }
};

exports.addUserService = async (req, res) => {
  const { firstName, lastName, email, address, password, avater, month } =
    req.body;
  try {
    const emails = email.toLowerCase();

    User.findOne({ email: emails }).exec(async (error, user) => {
      if (user)
        return res.status(400).json({
          error: "User already registered",
        });

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      const newUser = new User({
        firstName,
        lastName,
        email: emails,
        month,
        avater,
        password: hashedPassword,
        address,
        referralCode: await generateReferralCode(),
      });

      await newUser.save();
      return res.status(201).json({ message: "success", newUser });
    });
  } catch (error) {
    res.status(500).json({ message: "Invalid" });
  }
};

exports.signinUsers = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emails = email.toLowerCase();

    const user = await User.findOne({ email: emails });
    if (!user) {
      return res.status(422).json({
        Success: false,
        code: 401,
        message: "User Not Found",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (isPasswordMatched) {
      const token = generateJwtToken({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avater: user.avater,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "success",
        token,
        user,
      });
    } else {
      return res.status(422).json({
        Success: false,
        code: 422,
        message: "Invalid Credential",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({
      Success: false,
      code: 401,
      message: "Invalid Credential",
      error: error,
    });
  }
};

// get all Users
exports.getUsersService = async (req, res) => {
  const { q, page, size } = req.query;

  let query = { isDelete: false };
  if (q !== "undefined" || q !== undefined || q) {
    let regex = new RegExp(q, "i");
    query = {
      ...query,
      $or: [{ firstName: regex }, { email: regex }, { lastName: regex }],
    };
  }

  const totalDocuments = await User.countDocuments({});
  const pageNumber = page ? parseInt(page) : 1;
  const limit = size ? parseInt(size) : 10;
  const skipCount = (pageNumber - 1) * limit;

  const users = await User.find(query)
    .select("-password")
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);

  const startIndex = skipCount + 1;
  const endIndex = skipCount + users.length;

  res.status(200).json({ users, totalDocuments, startIndex });
};

// update Users
exports.updateUserAddressService = async ({
  id,
  city,
  zipCode,
  regionName,
  country,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  console.log(id, city, zipCode, regionName, country);
  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!User) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    user.address.country = country ? country : user.address.country;
    user.address.zipCode = zipCode ? zipCode : user.address.zipCode;
    user.address.city = city ? city : user.address.city;
    user.address.regionName = regionName ? regionName : user.address.regionName;

    await user.save();

    response.data.user = withoutPassword(user);

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateUserService = async ({
  id,
  firstName,
  lastName,
  email,
  phone,
  avater,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!User) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    user.firstName = firstName ? firstName : user.firstName;
    user.lastName = lastName ? lastName : user.lastName;
    user.email = email ? email : user.email;
    user.phone = phone ? phone : user.phone;
    user.avater = avater ? avater : user.avater;

    // credit is deliberately NOT writable here -- see the comment above.

    await user.save();

    response.data.user = withoutPassword(user);

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateCreditService = async ({ id, credit, isUpdate }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  try {
    const amount = parseFloat(credit);
    if (!Number.isFinite(amount) || amount <= 0) {
      response.code = 422;
      response.status = "failed";
      response.message = "Enter a valid credit amount";
      return response;
    }

    const existing = await User.findOne({ _id: id }).select("_id").lean();
    if (!existing) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    let deposit = null;
    if (isUpdate) {
      // Claim the deposit first, atomically. Two admins pressing Give Credit on
      // the same row used to credit the user twice.
      deposit = await Deposit.findOneAndUpdate(
        {
          _id: isUpdate,
          userId: String(id),
          isDelete: false,
          status: { $ne: "completed" },
        },
        { status: "completed" },
        { new: true }
      );
      if (!deposit) {
        response.code = 409;
        response.status = "failed";
        response.message =
          "This deposit was already credited, deleted, or does not belong to this user.";
        return response;
      }
    }

    // $inc, so concurrent credits cannot overwrite each other.
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $inc: { credit: amount } },
      { new: true }
    );

    // The ledger entry: what the user sees as "Credit purchase".
    const paid = deposit ? parseFloat(deposit.amount) : amount;
    try {
      await Transactions.create({
        userId: id,
        amount,
        exactAmount: Number.isFinite(paid) ? paid : amount,
        isCompleted: "Done",
        date: new Date().toDateString(),
        invoice: deposit ? `DEP-${deposit.trxid}` : `ADM-${Date.now()}`,
        kind: deposit ? "recharge" : "admin-credit",
        reference: deposit ? String(deposit._id) : undefined,
        eventId: deposit ? `deposit:${deposit._id}` : undefined,
        isDelete: false,
      });
    } catch (ledgerError) {
      console.error("[credit] could not write the ledger entry:", ledgerError);
    }

    // Pay the referrer, based on what was actually paid (not on bonus credit).
    if (deposit && Number.isFinite(paid) && paid > 0) {
      try {
        await payReferralBonus({
          buyerId: id,
          paidAmount: paid,
          referralCode: deposit.referralCode,
          eventId: `deposit:${deposit._id}`,
        });
      } catch (referralError) {
        console.error("[referral] payout failed:", referralError);
      }
    }

    response.data.user = withoutPassword(user);
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/**
 * Admin: hand a bonus to selected users.
 *   type "earn"   - added to the user's earnings (they can convert it to credit,
 *                   exactly like referral earnings)
 *   type "credit" - added straight to posting credit
 * Every payout is written to the ledger so the user sees it in Transaction
 * History and the admin can audit it.
 */
exports.giveBonusService = async ({ userIds, amount, type, note }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Bonus sent",
    given: 0,
  };

  try {
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!Number.isFinite(value) || value <= 0 || value > 10000) {
      response.code = 422;
      response.status = "failed";
      response.message = "Enter an amount between 0.01 and 10,000.";
      return response;
    }
    const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map(String))].slice(0, 500);
    if (ids.length === 0) {
      response.code = 422;
      response.status = "failed";
      response.message = "Select at least one user.";
      return response;
    }

    if (type !== "earn" && type !== "credit") {
      response.code = 422;
      response.status = "failed";
      response.message = 'Type must be "earn" or "credit".';
      return response;
    }
    const asEarnings = type !== "credit";
    const cleanNote = String(note || "").trim().slice(0, 200);

    for (const userId of ids) {
      const update = asEarnings
        ? { $inc: { referralEarnings: value } }
        : { $inc: { credit: value } };
      const user = await User.findOneAndUpdate(
        { _id: userId, isDelete: false },
        update,
        { new: true }
      ).select("_id");
      if (!user) continue;

      await Transactions.create({
        userId,
        amount: value,
        exactAmount: value,
        isCompleted: "Done",
        date: new Date().toDateString(),
        invoice: `BONUS-${Date.now()}-${response.given}`,
        kind: asEarnings ? "earn-bonus" : "admin-credit",
        note: cleanNote || undefined,
        isDelete: false,
      });
      response.given += 1;
    }

    response.message = `Bonus of $${value.toFixed(2)} sent to ${response.given} user(s).`;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Users
exports.updatePassordService = async ({ id, password, oldPassword }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!user) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

    if (isPasswordMatched) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword ? hashedPassword : user.password;

      await user.save();

      response.data.user = withoutPassword(user);

      return response;
    } else {
      response.code = 422;
      response.status = "failed";
      response.message = "Old pass is wrong";
      return response;
    }
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// delete Users
exports.deleteUserService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete User successfully",
  };

  try {
    const user = await User.findOne({
      _id: id,
      isDelete: false,
    });
    if (!user) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    await user.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get Users by search
exports.searchUserService = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User data found successfully",
    data: {},
  };

  try {
    let query = { isDelete: false };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [{ name: regex }, { category: regex }],
      };
    }

    response.data.Users = await User.find(query)
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.Users.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Users by id
exports.getUserService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled User successfully",
    data: {},
  };

  console.log(id);

  try {
    response.data.user = await User.findOne({
      _id: id,
      isDelete: false,
    })
      // The password hash was being sent to every caller of this public route.
      .select("-__v -isDelete -password")
      .exec();

    if (!response.data.user) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User found";
      return response;
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.increaseUserCredit = async (id, amount) => {
  const user = await User.findOne({
    _id: id,
  }).exec();

  user.credit = user.credit ? parseFloat(user.credit) + amount : amount;

  await user.save();
};
