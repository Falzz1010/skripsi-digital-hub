
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatBoxProps {
  userRole: 'student' | 'lecturer';
}

export const ChatBox = ({ userRole }: ChatBoxProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "lecturer",
      name: "Dr. Siti Nurhaliza",
      message: "Halo Ahmad, bagaimana progress Bab 2 nya? Saya sudah review outline yang kamu kirim kemarin.",
      time: "10:30",
      date: "Hari ini"
    },
    {
      id: 2,
      sender: "student", 
      name: "Ahmad Fauzi",
      message: "Selamat pagi Bu, untuk Bab 2 sudah 80% selesai. Saya masih menambahkan beberapa referensi untuk bagian metodologi research.",
      time: "10:45",
      date: "Hari ini"
    },
    {
      id: 3,
      sender: "lecturer",
      name: "Dr. Siti Nurhaliza", 
      message: "Bagus sekali! Untuk referensi, coba tambahkan paper terbaru dari IEEE 2023-2024. Jangan lupa perhatikan format APA style nya ya.",
      time: "10:50",
      date: "Hari ini"
    },
    {
      id: 4,
      sender: "student",
      name: "Ahmad Fauzi",
      message: "Baik Bu, akan saya perbaiki. Kira-kira kapan bisa saya kirimkan draft Bab 2 untuk direview?",
      time: "11:00", 
      date: "Hari ini"
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: userRole,
        name: userRole === 'student' ? 'Ahmad Fauzi' : 'Dr. Siti Nurhaliza',
        message: message,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        date: "Hari ini"
      };
      
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-green-100 text-green-700">
                {userRole === 'student' ? 'DP' : 'AF'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {userRole === 'student' ? 'Dr. Siti Nurhaliza, M.Kom' : 'Ahmad Fauzi'}
              </h3>
              <p className="text-sm text-gray-600">
                {userRole === 'student' ? 'Dosen Pembimbing' : 'Mahasiswa Bimbingan'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Online
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.sender === userRole ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-3 rounded-lg ${
                    msg.sender === userRole
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.time}
                </p>
              </div>
              <Avatar
                className={`h-8 w-8 ${
                  msg.sender === userRole ? 'order-1 mr-2' : 'order-2 ml-2'
                }`}
              >
                <AvatarFallback
                  className={
                    msg.sender === 'lecturer'
                      ? 'bg-green-100 text-green-700 text-xs'
                      : 'bg-blue-100 text-blue-700 text-xs'
                  }
                >
                  {msg.sender === 'lecturer' ? 'DS' : 'AF'}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Ketik pesan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
