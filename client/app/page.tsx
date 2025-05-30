// app/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react"; // Add useRef
import { GrSend } from "react-icons/gr";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

interface UserInfo {
  fullname: string;
  email: string;
  country: string;
}

interface Message {
  sender: UserInfo;
  text: string;
  timestamp: Date;
}

// Add this utility function for formatting time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} secs ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function Home() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<UserInfo[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredAlso, setIsHoveredAlso] = useState(false);
  const [tempUser, setTempUser] = useState<UserInfo>({
    fullname: "",
    email: "",
    country: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null); // Add ref for scrolling
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  ); // For typing indicator
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    socket.on("typing", ({ sender, isTyping }) => {
      if (typingTimeout) clearTimeout(typingTimeout);

      if (isTyping) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u?.email === sender?.email))
            return [...prev, sender];
          return prev;
        });

        // Set timeout to remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((u) => u?.email !== sender?.email)
          );
        }, 3000);

        setTypingTimeout(timeout);
      } else {
        setTypingUsers((prev) =>
          prev.filter((u) => u?.email !== sender?.email)
        );
      }
    });

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  useEffect(() => {
    const saved = localStorage.getItem("userInfo");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserInfo(parsed);
      socket.emit("register", parsed);
    } else {
      setShowPopup(true);
    }

    socket.on("message", (msg: Message) =>
      setMessages((prev) => [...prev, msg])
    );

    socket.on("typing", ({ sender, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev?.find((u) => u?.email === sender?.email))
          return [...prev, sender];
        return prev.filter((u) => u?.email !== sender?.email);
      });
    });

    socket.on("onlineUsers", (users: UserInfo[]) => setOnlineUsers(users));

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.off("onlineUsers");
    };
  }, []);

  const handleRegister = () => {
    localStorage.setItem("userInfo", JSON.stringify(tempUser));
    setUserInfo(tempUser);
    socket.emit("register", tempUser);
    setShowPopup(false);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("message", message);
    setMessage("");
    socket.emit("typing", false);
  };

  // Add this utility function above your component
  function getRandomColor(email: string) {
    const colors = [
      "bg-red-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-indigo-400",
      "bg-teal-400",
    ];
    // Use email hash to get consistent color for each user
    const hash = email
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  }

  function getInitials(fullname: string) {
    return fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <main className="max-w-full flex justify-center md:items-center py-10 px-5 mx-auto md:p-4 bg-slate-100 min-h-screen">
      <div className="w-4xl">
        <div className="flex justify-between items-center md:mb-6">
          <h1 className=" font-bold text-2xl md:text-5xl md:mb-4">
            <span className="text-lime-500 ">Idea</span>
            <span className="text-neutral-700 ">Bubble</span>
          </h1>

          <div className="mb-2 flex items-center gap-1">
          <div className="md:hidden flex -space-x-2">
            {onlineUsers.slice(0, 4).map((user, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full ${getRandomColor(
                  user.email
                )} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
              >
                {getInitials(user.fullname)}
              </div>
            ))}
            {onlineUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                +{onlineUsers.length - 4}
              </div>
            )}
          <span className={`w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
            {onlineUsers.length}
          </span>
           {" "}online
          </div>
        </div>

          <nav className="md:flex items-center gap-4 hidden ">
            <div className="rounded-full  h-12  w-12 border border-slate-300">
              <Image
                src="https://flagsapi.com/NG/shiny/64.png"
                alt="countries"
                height={200}
                className="object-contain h-full w-full overflow-hidden rounded-full"
                width={200}
              />
            </div>
            <div>
              <div className="uppercase font-semibold text-lg">
                <span>{userInfo?.fullname}</span>
              </div>
              <div className="text-sm text-gray-500">
                {userInfo?.email} | {userInfo?.country}
              </div>
            </div>
          </nav>
        </div>
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Enter Your Details</h2>
              <input
                placeholder="Full Name"
                autoFocus={true}
                className="w-full mb-2 border px-3 py-2"
                onChange={(e) =>
                  setTempUser({ ...tempUser, fullname: e.target.value })
                }
              />
              <input
                placeholder="Email"
                className="w-full mb-2 border px-3 py-2"
                onChange={(e) =>
                  setTempUser({ ...tempUser, email: e.target.value })
                }
              />
              <input
                placeholder="Country"
                className="w-full mb-4 border px-3 py-2"
                onChange={(e) =>
                  setTempUser({ ...tempUser, country: e.target.value })
                }
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                onClick={handleRegister}
              >
                Start Chatting
              </button>
            </div>
          </div>
        )}
        {/* <div className="mb-2 text-sm text-green-600">
          Online: {onlineUsers.length}
        </div> */}
        <div className="mb-2 flex items-center gap-1">
          <div className="hidden md:flex -space-x-2">
            {onlineUsers.slice(0, 4).map((user, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full ${getRandomColor(
                  user.email
                )} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
              >
                {getInitials(user.fullname)}
              </div>
            ))}
            {onlineUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                +{onlineUsers.length - 4}
              </div>
            )}
          <span className={`w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
            {onlineUsers.length}
          </span>
           {" "}online
          </div>
        </div>
        {/* implement it here */}
        <div
          ref={messagesContainerRef}
          className="flex bg-white  gap-5  text-black rounded-2xl shadow p-4 mb-4 min-h-[70dvh] md:min-h-[40vh] max-h-[50vh] overflow-y-auto"
        >
          <div className="flex-1">
            {messages
              ?.filter((m) => m.sender?.email !== userInfo?.email)
              .map((msg, index) => (
                <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} key={index} className="mb-2 flex  flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-slate-500 text-sm capitalize">
                      {msg?.sender?.fullname}
                    </span>
                  </div>
                  <div>
                    <div className="bg-lime-200 w-fit  px-3 py-2 rounded-2xl ">
                      {msg.text}
                    </div>
                    {isHovered && (<span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(msg.timestamp))}
                    </span>)}
                  </div>
                </div>
              ))}
            {typingUsers.length > 0 && (
              <div className="italic text-gray-500">
                {typingUsers?.map((u, i) => (
                  <span key={i}>
                    {u?.fullname}
                    {i < typingUsers?.length - 1 ? ", " : ""}
                  </span>
                ))}{" "}
                is typing...
              </div>
            )}
          </div>
          <div className="flex-1">
            {messages
              .filter((m) => m?.sender?.email === userInfo?.email)
              .map((msg, index) => (
                <div
                onMouseEnter={() => setIsHoveredAlso(true)} onMouseLeave={() => setIsHoveredAlso(false)}
                  key={index}
                  className="mb-2 flex items-end flex-col  text-left"
                >
                  {/* <div className="">
                    <span className="font-semibold">You</span>
                  </div> */}
                  <div className="bg-slate-100  px-3 py-2 rounded-2xl ">
                    {msg.text}
                  </div>
                  {isHoveredAlso && (<span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(msg.timestamp))}
                    </span>)}
                </div>
              ))}
          </div>
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>
        <div className="flex gap-2 mt-4">
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", true);
            }}
            onBlur={() => socket.emit("typing", false)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded-full px-4 py-2"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            disabled={message.length < 1}
            className="bg-blue-500 text-white px-4 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            <GrSend />
          </button>
        </div>
      </div>
    </main>
  );
}
