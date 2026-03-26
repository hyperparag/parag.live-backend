const { addReportServices, getReportsServices, updateReportServices , deleteReportServices } = require("./services");




exports.addReport = async (req, res) => {

  const { status, code, message } = await addReportServices({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.getReport = async(req , res)=>{
  const {status , code , message, data} = await getReportsServices({
    ...req.query,
  });
  if (data.reports) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
}


  // update Reports
  exports.updateReports = async (req, res) => {
    const { status, code, message, data } = await updateReportServices({
      ...req.params,
      ...req.body,
    });
    if (data.reports) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };
  

  // update Reports
  exports.deleteReport = async (req, res) => {
    const { status, code, message } = await deleteReportServices({
      ...req.params,
    });
    res.status(code).json({ code, status, message });
  };
  

  

