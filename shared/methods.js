const validateName = name => {
  if (name === undefined || name === "" || name.length === 0) {
    return false;
  }
  return true;
};

module.exports = validateName;
