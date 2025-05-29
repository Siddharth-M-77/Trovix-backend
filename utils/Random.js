export const generateReferralCode = () => {
  const namePart = "TROVIX";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${namePart}${randomDigits}`;
};

export const randomUsername = () => {
  const characters = "0123456789";
  let result = "";
  const length = 4;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `TROVIX${result}`;
};
export const generateTxHash = () => {
  return '0x' + Math.random().toString(16).substring(2) + Date.now().toString(16);
}


