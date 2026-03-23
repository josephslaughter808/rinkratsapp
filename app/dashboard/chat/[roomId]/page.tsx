import ChatRoomClient from "./ChatRoomClient";

export default function ChatRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <ChatRoomClient roomId={params.roomId} />;
}
