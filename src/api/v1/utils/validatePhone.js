module.exports = (phone) => {
    const regexp = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!regexp.test(phone)) {
      return 'Invalid phone number';
    }
    return '';
  };