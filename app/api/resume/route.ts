import { NextResponse } from 'next/server';
import { generateUploadUrl } from '../../lib/s3';
import { getSupabaseClient } from '../../services/supabase'; // 路径根据你项目结构调整

export async function POST(request: Request) {
    try {
        const { userId, fileName } = await request.json();

        if (!userId || !fileName) {
            return NextResponse.json(
                { error: 'User ID and file name are required' },
                { status: 400 }
            );
        }

        // 生成上传 URL
        const { signedUrl, fileUrl } = await generateUploadUrl(userId, fileName);

        // 获取 Supabase 客户端
        const supabase = getSupabaseClient();

        // 更新用户数据库中的简历链接
        const { error: updateError } = await supabase
            .from('users')
            .update({ resume: fileUrl })
            .eq('user_id', userId);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to update user resume' },
                { status: 500 }
            );
        }

        return NextResponse.json({ signedUrl, fileUrl });
    } catch (error) {
        console.error('Error in resume upload:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
