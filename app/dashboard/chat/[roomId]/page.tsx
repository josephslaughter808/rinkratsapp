import ChatRoomClient from "./ChatRoomClient";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ChatRoomClient roomId={roomId} />;
}
