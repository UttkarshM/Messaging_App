import { useState } from "react";
import './login.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import upload from "../lib/upload";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const Login = () => {
    const [avatar, setAvatar] = useState({ file: null, url: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error messages
    const navigate = useNavigate(); // Initialize navigate

    const handleAvatar = (e) => {
        setAvatar({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Reset error state
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            const imgUrl = await upload(avatar.file);

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
            });
            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });

            console.log("Account created");
            navigate('/chat'); // Redirect to chat page after registration
        } catch (err) {
            console.log(err);
            setError("Error creating account: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); 

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/chat'); 
        } catch (err) {
            console.log(err);
            setError("Error logging in: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            {error && <div className="error-message">{error}</div>} {}
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}> 
                    <input type="text" placeholder="Email" name="email" required />
                    <input type="password" placeholder="Password" name="password" required />
                    <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
                </form>
            </div>
            <div className="separator">
                <div className="item">
                    <h2>Create an Account</h2>
                    <form onSubmit={handleRegister}>
                        <label htmlFor="file">
                            <img src={avatar.url || "../images/user.png"} alt="" />
                            Upload an image
                        </label>
                        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                        <input type="text" placeholder="Username" name="username" required />
                        <input type="text" placeholder="Email" name="email" required />
                        <input type="password" placeholder="Password" name="password" required />
                        <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
