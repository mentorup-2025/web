'use client';

import { Dropdown, Button, Space } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import type { SearchFiltersType } from '../../../types';

type Props = {
    minPrice: number;
    maxPrice: number;
    minYoe: number;
    maxYoe: number;
    onChange: (patch: Partial<SearchFiltersType>) => void;
    currentFilters: SearchFiltersType; // 新增：接收当前 filters
};

type ActiveKey = 'price' | 'yoe' | null;

export default function TopFilters({
                                       minPrice,
                                       maxPrice,
                                       minYoe,
                                       maxYoe,
                                       onChange,
                                       currentFilters, // 新增
                                   }: Props) {
    const [active, setActive] = useState<ActiveKey>(null);

    // 新增：根据当前 filters 更新 active 状态
    useEffect(() => {
        if (currentFilters.minPrice !== undefined || currentFilters.maxPrice !== undefined) {
            setActive('price');
        } else if (currentFilters.minExperience !== undefined || currentFilters.maxExperience !== undefined) {
            setActive('yoe');
        } else {
            setActive(null);
        }
    }, [currentFilters]);

    const priceItems: MenuProps['items'] = useMemo(() => {
        const mid = Math.round((minPrice + maxPrice) / 2);
        return [
            { key: `p-${minPrice}-${maxPrice}`, label: `All ($${minPrice}–$${maxPrice}+)` },
            { key: `p-${minPrice}-${mid}`, label: `$${minPrice}–$${mid}` },
            { key: `p-${mid}-${maxPrice}`, label: `$${mid}–$${maxPrice}+` },
            { type: 'divider' as const },
            { key: 'p-clear', label: 'Clear Price' },
        ];
    }, [minPrice, maxPrice]);

    const yoeItems: MenuProps['items'] = useMemo(() => {
        const thirds = Math.max(minYoe, Math.floor((minYoe + maxYoe) / 3));
        const twothirds = Math.max(thirds + 1, Math.floor(((minYoe + maxYoe) * 2) / 3));
        return [
            { key: `y-${minYoe}-${maxYoe}`, label: `All (${minYoe}–${maxYoe}+ YOE)` },
            { key: `y-${minYoe}-${thirds}`, label: `${minYoe}–${thirds} YOE` },
            { key: `y-${thirds + 1}-${twothirds}`, label: `${thirds + 1}–${twothirds} YOE` },
            { key: `y-${twothirds + 1}-${maxYoe}`, label: `${twothirds + 1}–${maxYoe}+ YOE` },
            { type: 'divider' as const },
            { key: 'y-clear', label: 'Clear YOE' },
        ];
    }, [minYoe, maxYoe]);

    const handlePriceClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'p-clear') {
            setActive(null);
            onChange({ minPrice: undefined, maxPrice: undefined });
            return;
        }
        if (typeof key === 'string' && key.startsWith('p-')) {
            const [, lo, hi] = key.split('-');
            setActive('price');
            onChange({
                minPrice: Number(lo),
                maxPrice: Number(hi),
            });
        }
    };

    const handleYoeClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'y-clear') {
            setActive(null);
            onChange({ minExperience: undefined, maxExperience: undefined });
            return;
        }
        if (typeof key === 'string' && key.startsWith('y-')) {
            const [, lo, hi] = key.split('-');
            setActive('yoe');
            onChange({
                minExperience: Number(lo),
                maxExperience: Number(hi),
            });
        }
    };

    return (
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <Space size="middle">
                <Dropdown menu={{ items: priceItems, onClick: handlePriceClick }} trigger={['click']}>
                    <Button type={active === 'price' ? 'primary' : 'default'}>
                        Price <DownOutlined />
                    </Button>
                </Dropdown>

                <Dropdown menu={{ items: yoeItems, onClick: handleYoeClick }} trigger={['click']}>
                    <Button type={active === 'yoe' ? 'primary' : 'default'}>
                        Year of Experience <DownOutlined />
                    </Button>
                </Dropdown>
            </Space>
        </div>
    );
}