import { useEffect, useState } from "react";
import { apiFetch } from "../../api.js";

function SubscriptionUploader({ setFile, file, setPreviewUrl, auth, setAuth, onAuthExpired, result, setResult }) {

    function handleFileChange(event) {
        const selectFile = event.target.files[0];

        if (selectFile) {
            setFile(selectFile);
            const imageUrl = URL.createObjectURL(selectFile);
            setPreviewUrl(imageUrl);
        } else {
            setFile(null);
            setPreviewUrl('');
        }
        return;
    }

    async function uploadPictureToBackend() {
        if (!file) {
            return;
        }
        const formData = new FormData();
        formData.append("screenshot", file);

        const response = await apiFetch('/subscription/analyze',
            {
                method: 'POST',
                body: formData,
            },
            auth,
            setAuth,
            onAuthExpired
        )
        const data = await response.json();
        console.log(data);
        setResult(data);
    }

    return (
        <>
            <input type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange} />

            <button onClick={uploadPictureToBackend}>
                Upload
            </button>
        </>
    );
}

export default SubscriptionUploader;