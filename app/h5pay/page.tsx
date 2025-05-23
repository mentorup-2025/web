'use client'

import React, { useState, ChangeEvent } from 'react'

export default function H5PayPage() {
    const [orderNo, setOrderNo] = useState<string>(Date.now().toString())
    const [amount, setAmount]   = useState<string>('1')
    const [loading, setLoading] = useState<boolean>(false)

    const handlePay = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/h5pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description:  '测试商品',
                    out_trade_no: orderNo,
                    total:        parseInt(amount, 10)
                })
            })
            const data: { h5_url?: string; error?: string } = await res.json()
            if (data.h5_url) {
                window.location.href = data.h5_url
            } else {
                alert(data.error || '支付接口调用失败')
            }
        } catch (err) {
            console.error(err)
            alert('网络错误，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    const onOrderNoChange = (e: ChangeEvent<HTMLInputElement>) => {
        setOrderNo(e.target.value)
    }
    const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value)
    }

    return (
        <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
            <h1>微信 H5 支付示例</h1>

            <div style={{ marginBottom: 12 }}>
                <label htmlFor="orderNo">
                    订单号：
                    <input
                        id="orderNo"
                        type="text"
                        value={orderNo}
                        onChange={onOrderNoChange}
                        style={{ marginLeft: 8, width: '100%' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label htmlFor="amount">
                    金额（分）：
                    <input
                        id="amount"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={onAmountChange}
                        style={{ marginLeft: 8, width: 100 }}
                    />
                </label>
            </div>

            <button
                onClick={handlePay}
                disabled={loading}
                style={{
                    padding: '8px 16px',
                    fontSize: 16,
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? '处理中...' : '立即支付'}
            </button>
        </div>
    )
}