const { addTransactionServices, getTransactionsServices, updateTransactionServices , deleteTransactionServices } = require("./services");




exports.addTransaction = async (req, res) => {

  const { status, code, message } = await addTransactionServices({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.getTransaction = async(req , res)=>{
  const {status , code , message, data} = await getTransactionsServices({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
}
exports.getTransactionUser = async (req, res) => {
  const { status, code, message, data } = await getTransactionsUserServices({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};


  // update Transactions
  exports.updateTransactions = async (req, res) => {
    const { status, code, message, data } = await updateTransactionServices({
      ...req.params,
      ...req.body,
    });
    if (data.transactions) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };
  

  // update Transactions
  exports.deleteTransaction = async (req, res) => {
    const { status, code, message } = await deleteTransactionServices({
      ...req.params,
    });
    res.status(code).json({ code, status, message });
  };
  

  

