// Fixed zone ahead of UTC with no DST, so local-date bugs fail on every machine.
module.exports = async () => {
  process.env.TZ = 'Asia/Manila';
};
