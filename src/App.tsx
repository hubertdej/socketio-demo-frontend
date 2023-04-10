import React, { useEffect, useReducer, useState } from 'react';
import SubscriberWidget from './widgets/SubscriberWidget';
import { Client } from './client/interfaces';
import { SocketClient } from './client/SocketClient';
import { LruStorage } from './client/LruStorage';
import { SessionStorage } from './client/SessionStorage';
import SubscriberCreator from './widgets/SubscriberCreator';

type SubscriberItem = {
  id: string;
  topics: string[];
};

const client: Client = new SocketClient(
  'http://localhost:5001',
  new LruStorage(new SessionStorage(), 100000),
);

function App() {
  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, []);

  const [subscribers, setSubscribers] = useState<ReadonlyArray<SubscriberItem>>([]);
  const [isScrollEnabled, toggleScrollEnabled] = useReducer(value => !value, false);

  function addSubscriber(topics: string[]) {
    setSubscribers(prevSubs => [...prevSubs, { id: crypto.randomUUID(), topics }]);
  }

  function removeSubscriber(id: string) {
    setSubscribers(prevSubs => prevSubs.filter(s => s.id !== id));
  }

  return (
        <div>
            <div style={{ textAlign: 'right' }}>
                <input id="scroll" type="checkbox" checked={isScrollEnabled} onChange={toggleScrollEnabled}/>
                <label htmlFor="scroll">Enable auto-scroll</label>
            </div>
            <SubscriberCreator onCreate={topics => addSubscriber(topics)}/>
            <div>
                {subscribers.map(({ id, topics }) => (
                    <div key={id}>
                        <SubscriberWidget
                            client={client}
                            topics={topics}
                            autoScroll={isScrollEnabled}
                        />
                        <button onClick={() => removeSubscriber(id)}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
  );
}

export default App;
