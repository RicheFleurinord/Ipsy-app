import type { Metadata } from "next";
import ChatView from "./ChatView";

export const metadata: Metadata = { title: "Discuter avec IPsy" };

export default function Page() {
  return <ChatView />;
}
