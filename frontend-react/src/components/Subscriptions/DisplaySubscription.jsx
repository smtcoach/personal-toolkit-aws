import { SubscriptionRow } from "./SubscriptionRow.jsx";

export function DisplaySubscription({ subscriptions, setSubscriptions, auth, setAuth, onAuthExpired }) {
    return (
        <>
            {subscriptions &&
                subscriptions.length > 0 &&
                subscriptions.map((subscription) => (
                    <div className="subscription-record" key={subscription.SK}>
                        <SubscriptionRow
                            subscription={subscription}
                            auth={auth}
                            setAuth={setAuth}
                            onAuthExpired={onAuthExpired}
                            setSubscriptions={setSubscriptions}
                        />
                    </div>
                ))}
        </>
    );
}
