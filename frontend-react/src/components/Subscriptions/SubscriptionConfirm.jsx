import { useState } from "react";
import { apiFetch } from "../../api.js";
function SubscriptionConfirm({ result, auth, setAuth, onAuthExpired }) {


    async function submitInfoToBackend() {
        if (!result) {
            return;
        }
        try {
            const response = await apiFetch('/subscription/submit',
                {
                    method: 'POST',
                    body: JSON.stringify(result),
                    headers: {
                        "Content-Type": "application/json"
                    }
                },
                auth,
                setAuth,
                onAuthExpired
            );
        } catch (error) {
            console.log(error.message);
        }
        if (!response.ok) {
            return;
        }
        const data = JSON.parse(await response.json());
        console.log(data);

    }

    return (
        <>
            <button onClick={submitInfoToBackend}>Save this Subscription</button>
        </>
    );
}

export default SubscriptionConfirm;