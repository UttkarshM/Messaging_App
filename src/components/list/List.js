import './List.css';
import Chatlist from './ChatList';
import useUserStore from '../lib/userStore';

const UserList = () => {
    const { currentUser } = useUserStore();
    return (
        <div className="User-List">
            <div className="User">
                <img className="icon" src={currentUser.avatar||require('../images/user.png')} alt="User icon" />
                <div className="name">{currentUser.username}</div>
            </div>
            <Chatlist />
        </div>
    );
}

export default UserList;
