import { create } from 'zustand';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import useUserStore from './userStore';

const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,

    changeChat: async (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        if (!currentUser) {
            console.warn("Current user is not available.");
            set({ chatId, user, isReceiverBlocked: false });
            return;
        }

        // Fetch the blocking status from Firestore
        const userDocRef = doc(db, 'users', user.id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const isBlocked = Array.isArray(userData.blockedUsers) && userData.blockedUsers.includes(currentUser.id);
            set({ chatId, user, isReceiverBlocked: isBlocked });
        } else {
            // Handle case where the user document does not exist
            console.warn("User document does not exist:", user.id);
            set({ chatId, user, isReceiverBlocked: false });
        }
    },

    changeBlock: () => {
        set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
    },
}));

export default useChatStore;

