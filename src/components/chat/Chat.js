import { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useChatStore from '../lib/chatStore';
import './Chat.css';

const ChatList = () => {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatLogsRef = useRef(null);
    const { chatId } = useChatStore();

    useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            if (res.exists()) {
                setChat(res.data());
                setMessages(res.data().messages || []);
            } else {
                setChat(null);
                setMessages([]);
            }
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    useEffect(() => {
        if (chatLogsRef.current) {
            chatLogsRef.current.scrollTop = chatLogsRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (message.trim() && !isSending) {
            setIsSending(true);

            const newMessage = {
                text: message,
                sender: 'you',
                timestamp: new Date(),
            };

            try {
                const chatDocRef = doc(db, "chats", chatId);
                const currentChatDoc = await getDoc(chatDocRef);
                const existingMessages = currentChatDoc.data().messages || [];

                // Update Firestore with the new message
                await updateDoc(chatDocRef, {
                    messages: [...existingMessages, newMessage],
                });

                // After Firestore update, fetch the latest messages
                const updatedChatDoc = await getDoc(chatDocRef);
                setMessages(updatedChatDoc.data().messages || []);

                // Clear the input after sending
                setMessage('');
            } catch (error) {
                console.error("Error sending message:", error);
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            handleSend();
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const newMessage = {
                    text: reader.result,
                    sender: 'you',
                    type: 'image',
                    timestamp: new Date(),
                };

                try {
                    const chatDocRef = doc(db, "chats", chatId);
                    const currentChatDoc = await getDoc(chatDocRef);
                    const existingMessages = currentChatDoc.data().messages || [];

                    await updateDoc(chatDocRef, {
                        messages: [...existingMessages, newMessage],
                    });

                    // Fetch the latest messages from Firestore
                    const updatedChatDoc = await getDoc(chatDocRef);
                    setMessages(updatedChatDoc.data().messages || []);
                } catch (error) {
                    console.error("Error uploading image:", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="chat-list">
            <div className="title">
                <img className='logo' src={chat?.avatar || require('../images/user.png')} alt="User logo" />
                <div className='name'>{chat ? chat.username : 'Chat'}</div>
            </div>
            <div className='chat-logs' ref={chatLogsRef}>
                {messages.map((msg, index) => (
                    <div className='message' key={index}>
                        {msg.type === 'image' ? (
                            <div className='you'>
                                <img src={msg.text} alt="Uploaded" className="message-image" />
                            </div>
                        ) : (
                            <div className={msg.sender === 'you' ? 'you' : 'recipient'}>
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
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                    id="image-upload" 
                />
                <div className='upload-button-container'>
                    <div htmlFor="image-upload" className="upload-button">📷</div>
                </div>
                <button className="send-button" onClick={handleSend} disabled={isSending}>Send</button>
            </div>
        </div>
    );
};

export default ChatList;


