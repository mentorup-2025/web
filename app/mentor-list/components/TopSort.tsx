'use client';
import { Dropdown, Button, Space } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import type { SearchFiltersType, SortOption } from '../../../types';

type Props = {
    onChange: (patch: Partial<SearchFiltersType>) => void;
    currentFilters: SearchFiltersType;
};

export default function TopSort({ onChange, currentFilters }: Props) {
    const priceItems: MenuProps['items'] = useMemo(() => [
        {
            key: 'price-asc',
            label: (
                <Space>
                    Price (Low to High)
                    <ArrowUpOutlined />
                </Space>
            )
        },
        {
            key: 'price-desc',
            label: (
                <Space>
                    Price (High to Low)
                    <ArrowDownOutlined />
                </Space>
            )
        },
        { type: 'divider' as const },
        { key: 'price-clear', label: 'Clear Price Sort' },
    ], []);

    const yoeItems: MenuProps['items'] = useMemo(() => [
        {
            key: 'yoe-asc',
            label: (
                <Space>
                    Experience (Low to High)
                    <ArrowUpOutlined />
                </Space>
            )
        },
        {
            key: 'yoe-desc',
            label: (
                <Space>
                    Experience (High to Low)
                    <ArrowDownOutlined />
                </Space>
            )
        },
        { type: 'divider' as const },
        { key: 'yoe-clear', label: 'Clear Experience Sort' },
    ], []);

    const handlePriceClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'price-clear') {
            onChange({ sort: null });
        } else {
            onChange({ sort: key as SortOption });
        }
    };

    const handleYoeClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'yoe-clear') {
            onChange({ sort: null });
        } else {
            onChange({ sort: key as SortOption });
        }
    };

    const isPriceActive = currentFilters.sort?.startsWith('price');
    const isYoeActive = currentFilters.sort?.startsWith('yoe');

    return (
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <Space size="middle">
                <Dropdown menu={{ items: priceItems, onClick: handlePriceClick }} trigger={['click']}>
                    <Button type={isPriceActive ? 'primary' : 'default'}>
                        Price
                        <DownOutlined />
                    </Button>
                </Dropdown>
                <Dropdown menu={{ items: yoeItems, onClick: handleYoeClick }} trigger={['click']}>
                    <Button type={isYoeActive ? 'primary' : 'default'}>
                        Experience
                        <DownOutlined />
                    </Button>
                </Dropdown>
            </Space>
        </div>
    );
}