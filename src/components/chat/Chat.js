import { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useChatStore from '../lib/chatStore';
import './Chat.css';
import useUserStore from '../lib/userStore';
import upload from '../lib/upload';
import { Upload } from 'lucide-react';

const ChatList = () => {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatLogsRef = useRef(null);
    const { chatId } = useChatStore();
    const { user } = useChatStore();
    const fileInputRef = useRef(null);



    const [ Recipient, setRecipient ] = useState({ username: 'Loading...', avatar: null });
    const { currentUser } = useUserStore();

    // console.log("Chat.js ,Chat ID:", chatId);
    // console.log("Chat.js ,User in chat:", user);
    // console.log("Chat.js ,Current user in chat:", currentUser);



useEffect(() => {
    if (!chatId) return;

    setMessages([]);

    const username = useChatStore.getState().user.username;
    const avatar = useChatStore.getState().user.avatar;

    // console.log("Setting recipient...");
    // console.log(username, avatar);
    setRecipient({ username, avatar });

    const chatDocRef = doc(db, "chats", chatId);

    // console.log("Setting up Firestore listener for chat:", chatId);

    const unsubscribe = onSnapshot(chatDocRef, (chatDocSnap) => {
        // console.log("Firestore snapshot received:", chatDocSnap);

        if (chatDocSnap.exists()) {
            const chatData = chatDocSnap.data();
            console.log("Updated chat data:", chatData);
            setMessages(chatData.messages || []);
            setChat(chatData);

            if (chatLogsRef.current) {
                chatLogsRef.current.scrollTop = chatLogsRef.current.scrollHeight;
            }
        } else {
            console.warn("No such chat document!");
        }
    });

    return () => {
        // console.log("Cleaning up Firestore listener");
        unsubscribe(); // Stop listening on unmount or chatId change
    };
}, [chatId]);


    const handleSend = async () => {
    if (message.trim() && !isSending) {
        setIsSending(true);

        const newMessage = {
            type:"text",
            text: message,
            sender: currentUser.id,
            timestamp: new Date(),
        };

        if (!newMessage.sender) {
            console.error("Sender ID is undefined");
            setIsSending(false);
            return;
        }

        try {
            const chatDocRef = doc(db, "chats", chatId);
            const currentChatDoc = await getDoc(chatDocRef);
            const existingMessages = currentChatDoc.data().messages || [];

            await updateDoc(chatDocRef, {
                messages: [...existingMessages, newMessage],
            });

            const updatedChatDoc = await getDoc(chatDocRef);
            setMessages(updatedChatDoc.data().messages || []);
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    }
};

    useEffect(() => {
        if (chatLogsRef.current) {
            chatLogsRef.current.scrollTop = chatLogsRef.current.scrollHeight;
        }
    }
    , [messages]);

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // programmatically trigger the file input
        }
    };

    
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = async (event) => {
        console.log("Image upload triggered");
    
        const file = event.target.files?.[0];
        if (!file) return;

        const imgUrl = await upload(file);
        const newMessage = {
            type: "image",
            text: imgUrl,
            sender: currentUser.id,
            timestamp: new Date(),
        };
        console.log("New message object:", newMessage.text);
        setIsSending(true);
        try {
            const chatDocRef = doc(db, "chats", chatId);
            const currentChatDoc = await getDoc(chatDocRef);
            const existingMessages = currentChatDoc.data().messages || [];

            await updateDoc(chatDocRef, {
                messages: [...existingMessages, newMessage],
            });

            const updatedChatDoc = await getDoc(chatDocRef);
            setMessages(updatedChatDoc.data().messages || []);
            setMessage('');
        } catch (error) {
            console.error("Error sending image:", error);
        } finally {
            setIsSending(false);
        }
    };
    
    

    
    return (
        <div className="chat-list">
            <div className="title">
                <img className='logo' src={Recipient?.avatar || require('../images/user.png')} alt="User logo" />
                <div className='name'>{Recipient.username || 'Chat'}</div>
            </div>
            <div className='chat-logs' ref={chatLogsRef}>
                {messages.map((msg, index) => (
            <div className='message' key={index}>
                {msg.type === 'image' ? (
                    <div className={msg.sender === currentUser.id ? 'you' : 'recipient'}>
                        <img className='image' src={msg.text} alt="User upload" />
                    </div>
                ) : (
                    <div className={msg.sender === currentUser.id ? 'you-text' : 'recipient-text'}>
                        {msg.text}
                    </div>
                )}
            </div>
            ))}

            </div>
            <div className="message-bar">
                <input 
                    type="text" 
                    className="message-input" 
                    placeholder="Type a message..." 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    onKeyPress={handleKeyPress} 
                    disabled={isSending}
                />
                <input 
                    type="file" 
                    accept="image/*"
                    className="image-input" 
                    ref={fileInputRef}
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                    id="image-upload" 
                />
                <div className='upload-button-container' onClick={handleClick}>
                    <Upload className='upload-button' />
                </div>
                <div className="send-button">
                    <button
                        onClick={handleSend} disabled={isSending}>Send</button>
                </div>
            </div>
        </div>
    );
};
export default ChatList;


