/**
 * 将净价 (net price) 转换为毛价 (gross price)
 * @param netPrice 用户输入的净价
 * @returns 毛价（保留 1 位小数）
 */
export function netToGross(netPrice: number): number {
    return Math.floor(netPrice * 1.45 + 5);
}

/**
 * 将毛价 (gross price) 转换为净价 (net price)
 * @param grossPrice 后端存储的毛价
 * @returns 净价（保留 1 位小数）
 */
export function grossToNet(grossPrice: number): number {
    return Number(((grossPrice - 5) / 1.45).toFixed(1));
}