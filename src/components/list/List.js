import './List.css';
import Chatlist from './ChatList';
import useUserStore from '../lib/userStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';


const UserList = () => {
    const { currentUser } = useUserStore();
    const onLogOut = async () => {
        console.log("Works");
        try {
            await signOut(auth); // Sign out the user
            console.log("User logged out successfully");
        } catch (error) {
            console.error("Error logging out: ", error);
        }
    }
    return (
        <div className="User-List">
            <div className="User">
                <img className="icon" src={currentUser.avatar||require('../images/user.png')} alt="User icon" />
                <div className="name">{currentUser.username}</div>
                <div className='logout'>
                    <button className='logout' onClick={onLogOut}>Exit</button>
                </div>
            </div>
            <Chatlist />
        </div>
    );
}

export default UserList;
