import { useParams } from 'react-router-dom';
import Reader from '@/components/reader/Reader';

export default function ReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>();

  if (!chapterId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Chapter Not Found</h1>
          <p className="text-muted-foreground">Invalid chapter ID</p>
        </div>
      </div>
    );
  }

  return <Reader chapterId={chapterId} />;
}