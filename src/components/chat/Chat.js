import { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useChatStore from '../lib/chatStore';
import './Chat.css';
import useUserStore from '../lib/userStore';

const ChatList = () => {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatLogsRef = useRef(null);
    const { chatId } = useChatStore();
    // const currentUser = { uid: }
    const [ Recipient, setRecipient ] = useState({ username: 'Loading...', avatar: null });
    const { currentUser } = useUserStore();

    const fetchUserById = async (userId) => {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const { username, avatar } = userDocSnap.data();
            return { username, avatar };
        } else {
            console.warn("No such user found!");
            return { username: null, avatar: null };
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return { username: null, avatar: null };
    }
};

        useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(doc(db, "chats", chatId), async (res) => {
            if (res.exists()) {
                const chatData = res.data();
                setChat(chatData);
                setMessages(chatData.messages || []);

                // Fetch the recipient's username if messages exist
                if (chatData.messages.length > 0) {
                    const recipientId = chatData.messages[0].sender; // Adjust this logic as necessary
                    const username = await fetchUserById(recipientId);
                    setRecipient(username);
                    console.log(Recipient);
                }
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

    
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
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
                    sender: currentUser.uid,
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
                <img className='logo' src={Recipient?.avatar || require('../images/user.png')} alt="User logo" />
                <div className='name'>{chat ? Recipient.username : 'Chat'}</div>
            </div>
            <div className='chat-logs' ref={chatLogsRef}>
                {messages.map((msg, index) => (
            <div className='message' key={index}>
                {/* {console.log(msg)} */}
                {msg.type === 'image' ? (
                    <div className={msg.sender === currentUser.id ? 'you' : 'recipient'}>
                        <img src={msg.text} alt="Uploaded" className="message-image" />
                    </div>
                ) : (
                    <div className={msg.sender === currentUser.id ? 'you' : 'recipient'}>
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
                <div className="send-button">
                    <button
                        onClick={handleSend} disabled={isSending}>Send</button>
                </div>
            </div>
        </div>
    );
};
export default ChatList;


