import { uploadBytesResumable, getDownloadURL, ref } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
    const date = new Date().toISOString().replace(/[-:.]/g, ""); 
    const storageRef = ref(storage, `images/${date}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {

                console.error("Upload failed:", error);
                switch (error.code) {
                    case 'storage/unauthorized':
                        reject("User doesn't have permission to access the object.");
                        break;
                    case 'storage/canceled':
                        reject("User canceled the upload.");
                        break;
                    case 'storage/unknown':
                        reject("Unknown error occurred, inspect error.serverResponse");
                        break;
                    default:
                        reject("Something went wrong: " + error.message);
                }
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                }).catch(err => {
                    reject("Error getting download URL: " + err.message);
                });
            }
        );
    });
}

export default upload;
