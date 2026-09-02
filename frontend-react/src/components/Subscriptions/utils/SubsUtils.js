import { apiFetch } from "../../../api";

export const loadSubscription = async (auth, setAuth, onAuthExpired) => {
    try {
        const response = await apiFetch(
            "/subscription",
            {
                method: "GET"
            },
            auth,
            setAuth,
            onAuthExpired
        );
        if (!response.ok) {
            return [];
        }
        return await response.json();
    } catch (error) {
        console.log(error.message);
    }
};

export async function deleteSubscription(SK, auth, setAuth, onAuthExpired) {
    try {
        const response = await apiFetch(
            "/subscription",
            {
                method: "DELETE",
                body: JSON.stringify({ SK: SK }),
                headers: {
                    "Content-Type": "application/json"
                }
            },
            auth,
            setAuth,
            onAuthExpired
        );

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.log(error);
    }
}

export async function updateSubscription(
    SK,
    auth,
    setAuth,
    onAuthExpired,
    serviceName,
    planName,
    billingCycle,
    amount,
    currency,
    firstPaymentDate,
    websiteUrl,
    notes
) {
    try {
        const response = await apiFetch(
            "/subscription",
            {
                method: "PUT",
                body: JSON.stringify({
                    SK: SK,
                    serviceName: serviceName,
                    planName: planName,
                    billingCycle: billingCycle,
                    amount: amount,
                    currency: currency,
                    firstPaymentDate: firstPaymentDate,
                    websiteUrl: websiteUrl,
                    notes: notes
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            },
            auth,
            setAuth,
            onAuthExpired
        );

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.log(error);
    }
}
