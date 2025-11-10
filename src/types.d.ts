// Cloudflare Workers 环境类型声明

declare const crypto: Crypto;
declare const TextEncoder: {
  new (): TextEncoder;
  prototype: TextEncoder;
};
declare const TextDecoder: {
  new (): TextDecoder;
  prototype: TextDecoder;
};

