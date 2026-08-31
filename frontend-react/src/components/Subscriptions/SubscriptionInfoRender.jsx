import { useEffect, useState } from "react";


function SubscriptionInfoRender({ result, setResult }) {

    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (result) {
            setName(result.name);
            setCost(result.cost);
            setDate(result.date);
        }
    }, [result]);

    return (
        <>
            <div>
                <p>
                    name:
                    <input type="text"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setResult({
                                name: event.target.value,
                                cost: cost,
                                date: date
                            })
                        }}
                    />
                </p>
                <p>
                    cost:
                    <input type="text"
                        value={cost}
                        onChange={(event) => {
                            setCost(event.target.value);
                            setResult({
                                name: name,
                                cost: event.target.value,
                                date: date
                            })
                        }}
                    />
                </p>
                <p>
                    date:
                    <input type="text"
                        value={date}
                        onChange={(event) => {
                            setDate(event.target.value);
                            setResult({
                                name: name,
                                cost: cost,
                                date: event.target.value
                            })
                        }}
                    />
                </p>
            </div>
        </>
    );
}

export default SubscriptionInfoRender;