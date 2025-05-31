// app/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { GrSend } from "react-icons/gr";
import { PiHandWavingDuotone } from "react-icons/pi";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

interface UserInfo {
  fullname: string;
  email: string;
  country: string;
  code?: string; // Optional, used for country code
  [key: string]: any; // Allow additional properties
}

interface Message {
  sender: UserInfo;
  text: string;
  timestamp: Date;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} secs ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function MessageBubble({
  message,
  isCurrentUser,
}: {
  message: Message;
  isCurrentUser: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] flex ${
          isCurrentUser ? "flex-col items-end" : "flex-col items-start"
        }`}
      >
        {!isCurrentUser && (
          <span className="font-medium text-slate-500 text-sm capitalize">
            {message?.sender?.fullname}
          </span>
        )}
        <div>
          <div
            className={`${
              isCurrentUser ? "bg-blue-500 text-white" : "bg-lime-200"
            } px-3 py-2 rounded-2xl`}
          >
            {message.text}
          </div>
          <span
            className={`text-xs text-gray-500 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {formatTimeAgo(new Date(message.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<UserInfo[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [tempUser, setTempUser] = useState<UserInfo>({
    fullname: "",
    email: "",
    country: "",
    code: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const countries = [
    { name: "Nigeria", code: "NG" },
    { name: "United States", code: "US" },
    { name: "United Kingdom", code: "GB" },
    { name: "Canada", code: "CA" },
    { name: "Germany", code: "DE" },
    { name: "France", code: "FR" },
    { name: "Japan", code: "JP" },
    { name: "Australia", code: "AU" },
    { name: "Brazil", code: "BR" },
    { name: "India", code: "IN" },
    // Add more countries as needed
  ];

  useEffect(() => {
    socket.on("typing", ({ sender, isTyping }) => {
      if (typingTimeout) clearTimeout(typingTimeout);

      if (isTyping) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u?.email === sender?.email))
            return [...prev, sender];
          return prev;
        });

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
          <h1 className=" font-bold text-2xl md:text-4xl text-slate-600 md:mb-4">
            {/* <span className="text-lime-500 ">Idea</span>
            <span className="text-neutral-700 ">Bubble</span> */}
            BONJOUR!
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
              <span
                className={`w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
              >
                {onlineUsers.length}
              </span>{" "}
              online
            </div>
          </div>

          <nav className="md:flex items-center gap-4 hidden ">
            <div className="rounded-full  h-12  w-12 border border-slate-300">
              <Image
                src={`https://flagsapi.com/${
                  countries.find((c) => c.name === userInfo?.country)?.code
                }/shiny/64.png`}
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
          <div className="fixed inset-0 bg-[#00000084] backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white grid grid-cols-1 mx-10 md:mx-0 rounded-2xl md:grid-cols-2  items-stretch  shadow max-w-2xl w-full">
              <div className="w-full hidden md:block h-full">
                <Image src="/background.jpg" className="object-cover h-full " alt="background" width={500} height={500} />
              </div>
              <div className="p-14 md:px-10 flex flex-col gap-3">
                <h1 className="text-2xl text-center font-semibold">Welcome to <span className="text-purple-600 font-bold ">Bonjour</span></h1>
                <h2 className="text-center  mb-4">
                  Enter Your Details to chat with others
                </h2>
                <input
                  placeholder="Full Name"
                  autoFocus={true}
                  className="w-full mb-2 border-b border-slate-500 focus:outline-0 focus:border-lime-700 px-3 py-2 rounded-xl"
                  onChange={(e) =>
                    setTempUser({ ...tempUser, fullname: e.target.value })
                  }
                />
                <input
                  placeholder="Email"
                  className="w-full mb-2 border-b border-slate-500 focus:outline-0 focus:border-lime-700 px-3 py-2 rounded-xl"
                  onChange={(e) =>
                    setTempUser({ ...tempUser, email: e.target.value })
                  }
                />
                <div className="relative mb-4">
                  <select
                    value={tempUser.country}
                    onChange={(e) =>
                      setTempUser({ ...tempUser, country: e.target.value })
                    }
                    className="w-full mb-2 border-b border-slate-500 focus:outline-0 focus:border-lime-700 px-3 py-2 rounded-xl appearance-none"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {tempUser.country && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Image
                        src={`https://flagsapi.com/${
                          countries.find((c) => c.name === tempUser.country)
                            ?.code
                        }/shiny/32.png`}
                        alt={tempUser.country}
                        width={24}
                        height={24}
                        className="h-4 w-auto"
                      />
                    </div>
                  )}
                </div>
                <button
                  className="bg-purple-500 text-white px-4 py-2  w-full hover:bg-purple-700 transition-colors rounded-full"
                  onClick={handleRegister}
                  disabled={
                    !tempUser.fullname || !tempUser.email || !tempUser.country
                  }
                >
                  Start Chatting
                </button>
              </div>
            </div>
          </div>
        )}
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
            <span
              className={`w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
            >
              {onlineUsers.length}
            </span>{" "}
            online
          </div>
        </div>
        <div
          style={{
            backgroundImage: `url(/background.png)`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          ref={messagesContainerRef}
          className="flex  object-contain flex-col bg-white gap-2 text-black rounded-2xl shadow p-4 mb-4 min-h-[70dvh] md:min-h-[50vh] md:max-h-[50vh] overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div>
                <h3 className="text-xl font-bold text-gray-500 mb-2">
                  No messages added yet
                </h3>
                <p className="text-base text-gray-600 mb-2">
                  There {onlineUsers.length === 1 ? "is" : "are"}{" "}
                  {onlineUsers.length}{" "}
                  {onlineUsers.length === 1 ? "person" : "people"} online
                </p>
                <p className="text-lg flex items-center gap-1 text-gray-500">
                  Start by saying <PiHandWavingDuotone color="red" size={30} />{" "}
                  hi to everyone
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                )
                .map((msg, index) => (
                  <MessageBubble
                    key={index}
                    message={msg}
                    isCurrentUser={msg.sender?.email === userInfo?.email}
                  />
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
            </>
          )}
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
