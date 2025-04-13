import { useState } from 'react';
import {
  arrayUnion,
  query,
  where,
  getDocs,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import useUserStore from '../lib/userStore';
import './addUser.css';

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(true);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');

    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        setUser({
          id: foundDoc.id,
          ...foundDoc.data(),
        });
        setError('');
      } else {
        setUser(null);
        setError('User not found.');
      }
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const handleAdd = async () => {
    if (!user) return;

    const userChatsRef = collection(db, 'userchats');
    const currentUserChatDocRef = doc(userChatsRef, currentUser.id);
    const userChatDocRef = doc(userChatsRef, user.id);

    try {
      const currentUserChatSnap = await getDoc(currentUserChatDocRef);
      const existingChats = currentUserChatSnap.exists()
        ? currentUserChatSnap.data().chats
        : [];

      const alreadyExists = existingChats.some(
        (chat) => chat.receiverId === user.id
      );
      if (alreadyExists) {
        setError('You already have a chat with this user.');
        return;
      }

      const chatRef = collection(db, 'chats');
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: new Date(),
        messages: [],
        participants: [currentUser.id, user.id],
      });

      if (!currentUserChatSnap.exists()) {
        await setDoc(currentUserChatDocRef, { chats: [] });
      }

      await updateDoc(currentUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: '',
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      const userChatSnap = await getDoc(userChatDocRef);
      if (!userChatSnap.exists()) {
        await setDoc(userChatDocRef, { chats: [] });
      }

      await updateDoc(userChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: '',
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      setUser(null);
      setError('');
      setVisible(false); // Hide box
    } catch (err) {
      console.error('Error in handleAdd:', err);
      setError('An error occurred while adding the user.');
    }
  };

  if (!visible) return null;

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by username..."
          name="username"
          required
        />
        <button type="submit">Search</button>
      </form>

      {error && <div className="error">{error}</div>}

      {user && (
        <div className="user">
          <div className="detail">
            <img
              src={user.avatar || require('../images/user.png')}
              alt=""
              className="avatar"
            />
            <span className="username">{user.username}</span>
            <button className="add-btn" onClick={handleAdd}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
