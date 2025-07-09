import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Users,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealTimeChat } from "@/components/RealTimeChat";

export const ChatSection = () => {
  const { profile, user } = useAuth();
  const [chatList, setChatList] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchChatList();
    
    // Real-time subscription for new messages
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchChatList();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchChatList = async () => {
    try {
      let chats: any[] = [];

      if (profile?.role === 'student') {
        // Get thesis and lecturer info
        const { data: thesis } = await supabase
          .from('thesis')
          .select(`
            id,
            title,
            lecturer:profiles!thesis_lecturer_id_fkey(id, full_name, role)
          `)
          .eq('student_id', profile.id)
          .single();

        if (thesis && thesis.lecturer) {
          chats = [{
            id: thesis.id,
            partner: thesis.lecturer,
            thesisTitle: thesis.title,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0
          }];
        }
      } else if (profile?.role === 'lecturer') {
        // Get all students under supervision (termasuk yang belum ada lecturer_id)
        const { data: thesisList } = await supabase
          .from('thesis')
          .select(`
            id,
            title,
            student:profiles!thesis_student_id_fkey(id, full_name, role)
          `)
          .or(`lecturer_id.is.null,lecturer_id.eq.${profile.id}`);

        chats = thesisList?.map(thesis => ({
          id: thesis.id,
          partner: thesis.student,
          thesisTitle: thesis.title,
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0
        })) || [];
      }

      // Get last message for each chat
      for (const chat of chats) {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('thesis_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMessage) {
          chat.lastMessage = lastMessage.content;
          chat.lastMessageTime = lastMessage.created_at;
        }

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thesis_id', chat.id)
          .neq('sender_id', user?.id);

        chat.unreadCount = count || 0;
      }

      setChatList(chats);
      
      // Auto-select first chat if no chat is selected
      if (chats.length > 0 && !selectedChat) {
        setSelectedChat(chats[0]);
      }
    } catch (error) {
      console.error('Error fetching chat list:', error);
      toast.error('Gagal memuat daftar chat');
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chatList.filter(chat =>
    chat.partner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.thesisTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Komunikasi</h2>
        <p className="text-muted-foreground">Chat real-time dengan dosen pembimbing/mahasiswa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pesan</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[450px] overflow-y-auto scrollbar">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>Belum ada chat</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {chat.partner?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">
                              {chat.partner?.full_name || 'Unknown User'}
                            </h4>
                            {chat.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.thesisTitle}
                          </p>
                          {chat.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {chat.lastMessage}
                            </p>
                          )}
                          {chat.lastMessageTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(chat.lastMessageTime).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <RealTimeChat
              thesisId={selectedChat.id}
              chatPartner={{
                id: selectedChat.partner.id,
                name: selectedChat.partner.full_name,
                role: selectedChat.partner.role
              }}
            />
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pilih Chat</h3>
                  <p className="text-muted-foreground">
                    Pilih percakapan untuk memulai chat
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};