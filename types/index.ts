// create a type with a role enum, the value contains 'mentor' and 'mentee'
export enum Role {
    MENTOR = 'mentor',
    MENTEE = 'mentee'
}

// 兼容两种后端形态：number 或 { price, type }
interface Service {
    type: string;
    price: number;
}

// mentor list page types
export interface Mentor {
    user_id: string;
    username: string;
    profile_url?: string | null;
    email?: string | null;
    // 若后端可能传 null，渲染前用：const industries = Array.isArray(user.industries) ? user.industries : [];
    industries: string[];

    mentor: {
        user_id: string;

        // 基本档案（允许为空，避免渲染时报错）
        title?: string | null;
        introduction?: string | null;
        company?: string | null;
        years_of_experience?: number | null;

        // 价格与服务（允许是 number 或 {price,type}；整体可选/可空）
        services?: Record<string, Service> | null;

        // 排名：用于默认排序；可能为 null（表示未设置）
        default_ranking?: number | null;

        created_at?: string | null;
    };
}

export type SortOption = 'price-asc' | 'price-desc' | 'yoe-asc' | 'yoe-desc' | null;

export interface SearchFiltersType {
    jobTitle?: string;
    industries?: string[];
    minExperience?: number;
    maxExperience?: number;
    minPrice?: number;
    maxPrice?: number;
    serviceTypes?: string[];
    company?: string[];
    sort?: SortOption;
}
