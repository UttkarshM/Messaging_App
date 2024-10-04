import './App.css';
import UserList from './components/list/List';
import ChatList from './components/chat/Chat';
import Login from './components/login/login';
import { auth } from './components/lib/firebase';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import useUserStore from './components/lib/userStore';
import useChatStore from './components/lib/chatStore';

function App() {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user ? user.uid : null);
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className='loading'>Loading....</div>;

  return (
    <div className="App">
      {currentUser ? (
        <>
          <UserList />
          {chatId && <ChatList />}
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
