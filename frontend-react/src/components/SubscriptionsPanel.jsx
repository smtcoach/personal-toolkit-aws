import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import SubscriptionUploader from './Subscriptions/SubscriptionUploader.jsx';
import SubscriptionInfoRender from "./Subscriptions/SubscriptionInfoRender.jsx";
import SubscriptionConfirm from "./Subscriptions/SubscriptionConfirm.jsx";
function SubscriptionsPanel({ auth, setAuth, onAuthExpired }) {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(()=>{
        console.log(result);
    }, [result])

    return (
        <>
            <div>
                {file && <p>Filename: {file.name}</p>}
                {previewUrl && (
                    <img
                        src={previewUrl}
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            maxHeight: "400px",
                            objectFit: "contain"
                        }}
                    />)}
            </div>
            <div>
                <SubscriptionUploader setFile={setFile} file={file} setPreviewUrl={setPreviewUrl} auth={auth} setAuth={setAuth} onAuthExpired={onAuthExpired} result={result} setResult={setResult} />
            </div>
            <div>
                <SubscriptionInfoRender result={result} setResult={setResult} />
            </div>
            <div>
                {result&&<SubscriptionConfirm result={result} auth={auth} setAuth={setAuth} onAuthExpired={onAuthExpired}/>}
            </div>
        </>
    );
}

export default SubscriptionsPanel;