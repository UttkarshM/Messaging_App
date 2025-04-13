import { useState } from "react"
import "./login.css"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import upload from "../lib/upload";
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const [functionType, setFunctionType] = useState(0) // 0 for sign in, 1 for sign up
  const [avatar, setAvatar] = useState({ file: null, url: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshPage = () => {
    window.location.reload();
  };
  


  const handleAvatar = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      })
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email")
    const password = formData.get("password")

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Logging in")
        refreshPage();
      
    } catch (err) {
      console.log(err)
      setError(`Error logging in: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    console.log("register")
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username")
    const email = formData.get("email")
    const password = formData.get("password")

    try {
        console.log("registering")
        console.log("User registered successfully")
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
        refreshPage();
    }
    catch (err) {
    console.log("Error registering user")
      console.log(err)
      setError(`Error creating account: ${err.message}`)
    } finally {
        console.log("Loading finished")
      setLoading(false)
    }
  }

  return (
    <div className="login">
      {functionType === 0 ? (
        <div className="item">
          <h2 className="type-h switch" onClick={() => setFunctionType(1)}>
            Switch to Sign up
          </h2>
          <h2 className="type-h">Sign In</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Email" name="email" required />
            <input type="password" placeholder="Password" name="password" required />
            <button className="sign-in" disabled={loading}>
              {loading ? "Loading" : "Sign In"}
            </button>
          </form>
        </div>
      ) : (
        <div className="item">
          <h2 className="type-h switch" onClick={() => setFunctionType(0)}>
            Switch to Sign in
          </h2>
          <h2 className="type-h">Sign up</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleRegister}>
            <label className="upload-image" htmlFor="file">
              <img
                className="avatar-logo"
                src={avatar.url || "/placeholder.svg?height=100&width=100"}
                alt="Avatar"
              />
              Avatar
            </label>
            <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
            <input type="text" placeholder="Username" name="username" required />
            <input type="text" placeholder="Email" name="email" required />
            <input type="password" placeholder="Password" name="password" required />
            <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default AuthForm
