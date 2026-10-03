const jwt = require("jsonwebtoken");

function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "unauthorised" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (decoded.role == "admin" || decoded.role == "superAdmin") {
        req.decoded = decoded;
        return next();
      }
      // Previously this branch did nothing at all: a valid token belonging to a
      // non-admin neither continued nor responded, so the request hung until the
      // gateway timed it out.
      return res.status(403).json({ message: "Forbidden" });
    });
  } catch (error) {
    console.log(error);
    next("Authentication Error");
  }
}

module.exports = verifyAdmin;
