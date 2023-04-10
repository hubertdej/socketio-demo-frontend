import React, { useEffect, useRef, useState } from 'react';
import { Client, Message } from '../client/interfaces';

function generateRandomLightColor() {
  const r = Math.floor(Math.random() * 128) + 128;
  const g = Math.floor(Math.random() * 128) + 128;
  const b = Math.floor(Math.random() * 128) + 128;
  return `rgb(${r}, ${g}, ${b})`;
}

type SubscriberProps = {
  client: Client;
  topics: string[];
  autoScroll?: boolean;
};

export function SubscriberWidget({ client, topics, autoScroll }: SubscriberProps) {
  const color = useRef<string>(generateRandomLightColor());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => []);

  useEffect(() => {
    const subscriptions = topics.map(topic =>
      client.subscribe(topic, (message: Message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      }),
    );
    return () => {
      setMessages([]);
      subscriptions.forEach(s => s.unsubscribe());
    };
  }, [client, topics]);

  useEffect(() => {
    if (autoScroll) {
      const container = containerRef.current;
      container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  });

  return (
        <div style={{ backgroundColor: color.current }}>
            <pre>Message count: {messages.length}; topics: {JSON.stringify(topics)}</pre>
            <div
                ref={containerRef}
                style={{
                  height: 150,
                  overflowY: 'scroll',
                  border: '1px solid black',
                }}
            >
                <pre>{JSON.stringify(messages, undefined, 2)}</pre>
            </div>
        </div>
  );
}

export default SubscriberWidget;
