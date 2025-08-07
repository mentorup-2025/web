export interface AliPayInfo {
  name: string;
  phone: string;
}

export interface WechatPayInfo {
  wechatId: string;
}

export interface UpdatePayoutInfoInput {
  alipayInfo?: AliPayInfo;
  wechatPayInfo?: WechatPayInfo;
} 