import { useState, useEffect } from 'react';
import './ChatList.css';
import AddUser from './addUser/addUser';
import useUserStore from '../lib/userStore';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useChatStore from '../lib/chatStore';

const Chatlist = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const { currentUser } = useUserStore();
    const { changeChat } = useChatStore();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "userchats", currentUser.id), async (docSnap) => {
            if (docSnap.exists()) {
                const items = docSnap.data().chats || [];
                
                const promises = items.map(async (item) => {
                    const userDocRef = doc(db, "users", item.receiverId);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const user = userDocSnap.data();
                        return { ...item, user };
                    }
                    return null; // Return null if user does not exist
                });

                const chatData = await Promise.all(promises);
                setChats(chatData.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt));
            }
        });

        return () => {
            unsub();
        };
    }, [currentUser.id]);

    const handleSelect = (chat) => {
        changeChat(chat.chatId, chat.user);
    };

    return (
        <div className='chatlist'>
            <div className='search'>
                <div className='bar'>
                    <input className='search-box' placeholder='Enter Chats' />
                    <img 
                        className='plus' 
                        src={addMode ? require('../images/plus.png') : require('../images/minus.png')}
                        onClick={() => setAddMode(prev => !prev)}
                        alt='plus symbol' 
                    />
                </div>
            </div>
            <div className='chat-logs'>
                {chats.map(chat => (
                    <div className='items' key={chat.chatId} onClick={() => handleSelect(chat)}>
                        <img className='item-logo' src={chat.user.avatar || require('../images/user.png')} alt='User Avatar' />
                        <div className='user-box'>{chat.user.username || chat.user.name}</div>
                    </div>
                ))}
            </div>
            {addMode && <AddUser />}
        </div>
    );
};

export default Chatlist;
