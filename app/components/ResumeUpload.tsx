'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResumeUploadProps {
  userId: string;
}

export default function ResumeUpload({ userId }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (file.type !== 'application/pdf') {
      setError('请上传 PDF 文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 获取上传 URL
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('获取上传链接失败');
      }

      const { signedUrl, fileUrl } = await response.json();

      // 上传文件到 S3
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('上传失败：', errorText);
        throw new Error('上传失败：' + errorText);
      }

      // 刷新页面以更新简历链接
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label
          htmlFor="resume-upload"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isUploading ? '上传中...' : '上传简历'}
        </label>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
} 