import { useState } from "react";
import {
    deleteSubscription,
    loadSubscription,
    updateSubscription
} from "./utils/SubsUtils.js";

export function SubscriptionRow({ subscription, auth, setAuth, onAuthExpired, setSubscriptions }) {
    const [serviceName, setServiceName] = useState(subscription.serviceName);
    const [planName, setPlanName] = useState(subscription.planName);
    const [billingCycle, setBillingCycle] = useState(subscription.billingCycle);
    const [amount, setAmount] = useState(subscription.amount);
    const [currency, setCurrency] = useState(subscription.currency);
    const [firstPaymentDate, setFirstPaymentDate] = useState(subscription.firstPaymentDate);
    const [websiteUrl, setWebsiteUrl] = useState(subscription.websiteUrl);
    const [notes, setNotes] = useState(subscription.notes);

    async function handleDelete() {
        await deleteSubscription(subscription.SK, auth, setAuth, onAuthExpired);
        const subsResult = await loadSubscription(auth, setAuth, onAuthExpired);
        setSubscriptions(subsResult);
    }

    async function handleUpdate() {
        await updateSubscription(
            subscription.SK,
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
        );
        const subsResult = await loadSubscription(auth, setAuth, onAuthExpired);
        setSubscriptions(subsResult);
    }

    return (
        <article className="subscription-record-card">
            <div className="subscription-record-grid">
                <label className="subscription-field">serviceName<input className="subscription-input" type="text" value={serviceName} onChange={(event) => setServiceName(event.target.value)} /></label>
                <label className="subscription-field">planName<input className="subscription-input" type="text" value={planName} onChange={(event) => setPlanName(event.target.value)} /></label>
                <label className="subscription-field">billingCycle<input className="subscription-input" type="text" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)} /></label>
                <label className="subscription-field">amount<input className="subscription-input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
                <label className="subscription-field">currency<input className="subscription-input" type="text" value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
                <label className="subscription-field">firstPaymentDate<input className="subscription-input" type="date" value={firstPaymentDate || ''} onChange={(event) => setFirstPaymentDate(event.target.value)} /></label>
                <label className="subscription-field subscription-field-wide">websiteUrl<input className="subscription-input" type="text" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} /></label>
                <label className="subscription-field subscription-field-wide">notes<input className="subscription-input" type="text" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            </div>
            <div className="subscription-record-actions">
                <button className="btn-secondary" onClick={handleUpdate}>Update</button>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
        </article>
    );
}
