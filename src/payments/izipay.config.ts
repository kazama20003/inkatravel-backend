// src/payments/izipay.config.ts
export default () => ({
  izipay: {
    username: process.env.IZIPAY_USERNAME,
    password: process.env.IZIPAY_PASSWORD,
    publicKey: process.env.IZIPAY_PUBLIC_KEY,
    hmacKey: process.env.IZIPAY_HMAC_SHA256,
  },
});
