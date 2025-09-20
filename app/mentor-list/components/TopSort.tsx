'use client';
import { Dropdown, Button, Space } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, ArrowUpOutlined, ArrowDownOutlined, StarFilled } from '@ant-design/icons';
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

    // ✅ 新增：Rating 的排序菜单
    const ratingItems: MenuProps['items'] = useMemo(() => [
        {
            key: 'rating-desc',
            label: (
                <Space>
                    Rating (High to Low)
                    <ArrowDownOutlined />
                </Space>
            )
        },
        {
            key: 'rating-asc',
            label: (
                <Space>
                    Rating (Low to High)
                    <ArrowUpOutlined />
                </Space>
            )
        },
        { type: 'divider' as const },
        { key: 'rating-clear', label: 'Clear Rating Sort' },
    ], []);

    const handlePriceClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'price-clear') onChange({ sort: null });
        else onChange({ sort: key as SortOption });
    };

    const handleYoeClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'yoe-clear') onChange({ sort: null });
        else onChange({ sort: key as SortOption });
    };

    // ✅ 新增：处理 Rating
    const handleRatingClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'rating-clear') onChange({ sort: null });
        else onChange({ sort: key as SortOption });
    };

    const isPriceActive = currentFilters.sort?.startsWith('price');
    const isYoeActive   = currentFilters.sort?.startsWith('yoe');
    const isRatingActive = currentFilters.sort?.startsWith('rating');

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

                {/* ✅ 新增 Rating 下拉按钮，位置在 Experience 右侧 */}
                <Dropdown menu={{ items: ratingItems, onClick: handleRatingClick }} trigger={['click']}>
                    <Button type={isRatingActive ? 'primary' : 'default'}>
                        <Space>
                            Rating
                            {/*<StarFilled />*/}
                            <DownOutlined />
                        </Space>
                    </Button>
                </Dropdown>
            </Space>
        </div>
    );
}
