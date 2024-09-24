import { arrayUnion, query, where, getDocs, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import './addUser.css';
import { useState } from 'react';
import { db } from '../../lib/firebase';
import useUserStore from '../../lib/userStore';

const AddUser = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const { currentUser } = useUserStore();

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setUser(querySnapshot.docs[0].data());
                setError(''); // Clear any previous error
            } else {
                setUser(null);
                setError("User not found.");
            }
        } catch (err) {
            console.error("Error searching for user:", err);
            setError("An error occurred. Please try again.");
        }
    };

const handleAdd = async () => {
    if (!user) return;

    const userChatsRef = collection(db, "userchats");
    const currentUserChatDocRef = doc(userChatsRef, currentUser.id);
    const userChatDocRef = doc(userChatsRef, user.id);

    try {
        // Check if the current user's chat document exists
        const currentUserChatSnap = await getDoc(currentUserChatDocRef);
        const existingChats = currentUserChatSnap.exists() ? currentUserChatSnap.data().chats : [];

        const chatExists = existingChats.some(chat => chat.receiverId === user.id);
        if (chatExists) {
            setError("You already have a chat with this user.");
            return;
        }

        // Create a new chat
        const chatRef = collection(db, "chats");
        const newChatRef = doc(chatRef);
        await setDoc(newChatRef, {
            createdAt: new Date(),
            messages: [],
            username: user.username,
            avatar: user.avatar,
        });

        // If the current user's chat document doesn't exist, create it
        if (!currentUserChatSnap.exists()) {
            await setDoc(currentUserChatDocRef, { chats: [] });
        }

        // Update userChats for both users
        await updateDoc(currentUserChatDocRef, {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: user.id,
                updatedAt: Date.now(),
            }),
        });

        // Check if the user being added has a chat document; if not, create it
        const userChatSnap = await getDoc(userChatDocRef);
        if (!userChatSnap.exists()) {
            await setDoc(userChatDocRef, { chats: [] });
        }

        await updateDoc(userChatDocRef, {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
            }),
        });

        setUser(null); // Clear the user after adding
        setError(''); // Clear any previous error
    } catch (err) {
        console.error("Error in handleAdd:", err);
        setError("An error occurred while adding the user.");
    }
};




    return (
        <div className='addUser'>
            <form onSubmit={handleSearch}>
                <input type='text' placeholder='Username' name='username' required />
                <button>Search</button>
            </form>
            {error && <div className='error'>{error}</div>}
            {user && (
                <div className='user'>
                    <div className='detail'>
                        <img src={user.avatar || require('../../images/user.png')} alt="" />
                        <span>{user.username}</span>
                        <button onClick={handleAdd}>Add</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddUser;
