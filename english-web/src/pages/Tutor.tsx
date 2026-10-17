import { useSearchParams } from 'react-router-dom';
import ChatView from '../components/ChatView';

export default function Tutor() {
  const [params] = useSearchParams();
  return <ChatView endpoint="/tutor/message" topic={params.get('topic') ?? undefined} starter={params.get('starter') ?? undefined} />;
}
